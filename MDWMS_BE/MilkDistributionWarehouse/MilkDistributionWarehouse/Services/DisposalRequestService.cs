using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.IdentityModel.Tokens;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;

namespace MilkDistributionWarehouse.Services
{
    public interface IDisposalRequestService
    {
        Task<(string, PageResult<T>?)> GetDisposalRequestList<T>(PagedRequest request, int? userId);
        Task<(string, DisposalRequestDetailDto?)> GetDisposalRequestDetail(string? disposalRequestId);
        Task<(string, List<ExpiredGoodsDisposalDto>?)> GetExpiredGoodsForDisposal();
        Task<(string, DisposalRequestCreateDto?)> CreateDisposalRequest(DisposalRequestCreateDto createDto, int? userId);
    }

    public class DisposalRequestService : IDisposalRequestService
    {
        private readonly IDisposalRequestRepository _disposalRequestRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGoodsRepository _goodsRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public DisposalRequestService(IDisposalRequestRepository disposalRequestRepository,
                                      IUserRepository userRepository,
                                      IGoodsRepository goodsRepository,
                                      IUnitOfWork unitOfWork,
                                      IMapper mapper)
        {
            _disposalRequestRepository = disposalRequestRepository;
            _userRepository = userRepository;
            _goodsRepository = goodsRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
        }

        public async Task<(string, PageResult<T>?)> GetDisposalRequestList<T>(PagedRequest request, int? userId)
        {
            if (userId == null) return ("UserId is invalid.", null);

            var user = await _userRepository.GetUserById(userId);
            if (user == null || user.Roles.IsNullOrEmpty()) return ("User is not valid", null);

            var userRoles = user.Roles.Select(r => r.RoleId).ToList();
            var disposalRequests = _disposalRequestRepository.GetAllDisposalRequests();

            if (userRoles.Contains(RoleType.WarehouseManager))
                disposalRequests = disposalRequests.Where(dr => dr.Status != null && 
                                                                (dr.Status != DisposalRequestStatus.Draft || (dr.Status == DisposalRequestStatus.Draft && dr.CreatedBy == userId)));

            if (userRoles.Contains(RoleType.SaleManager))
                disposalRequests = disposalRequests.Where(dr => dr.Status != null && dr.Status != DisposalRequestStatus.Draft);

            if (userRoles.Contains(RoleType.WarehouseStaff))
            {
                int[] statusAllowed = { DisposalRequestStatus.AssignedForPicking, DisposalRequestStatus.Picking, DisposalRequestStatus.Completed };
                disposalRequests = disposalRequests.Where(dr => dr.Status != null && statusAllowed.Contains((int)dr.Status) && dr.AssignTo == userId);
            }

            if (request.Filters != null && request.Filters.Any())
            {
                var fromDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "fromdate");
                var toDate = request.Filters.FirstOrDefault(f => f.Key.ToLower() == "todate");
                DateOnly.TryParse(fromDate.Value, out DateOnly startDate);
                DateOnly.TryParse(toDate.Value, out DateOnly endDate);
                disposalRequests = disposalRequests.Where(dr => (startDate == default || dr.EstimatedTimeDeparture >= startDate) &&
                                                                (endDate == default || dr.EstimatedTimeDeparture <= endDate));
                if (fromDate.Key != null) request.Filters.Remove(fromDate.Key);
                if (toDate.Key != null) request.Filters.Remove(toDate.Key);
            }

            var disposalRequestDtos = disposalRequests.ProjectTo<T>(_mapper.ConfigurationProvider);
            var result = await disposalRequestDtos.ToPagedResultAsync(request);

            if (!result.Items.Any())
                return ("Danh sách yêu cầu xuất hủy trống.".ToMessageForUser(), null);

            return ("", result);
        }

        public async Task<(string, DisposalRequestDetailDto?)> GetDisposalRequestDetail(string? disposalRequestId)
        {
            if (string.IsNullOrEmpty(disposalRequestId)) return ("Mã yêu cầu xuất hủy không hợp lệ.".ToMessageForUser(), null);

            var disposalRequest = await _disposalRequestRepository.GetDisposalRequestById(disposalRequestId);
            if (disposalRequest == null) return ("Không tìm thấy yêu cầu xuất hủy này.".ToMessageForUser(), null);

            var disposalRequestDetail = _mapper.Map<DisposalRequestDetailDto>(disposalRequest);
            return ("", disposalRequestDetail);
        }

        public async Task<(string, List<ExpiredGoodsDisposalDto>?)> GetExpiredGoodsForDisposal()
        {
            var expiredGoodsList = await _goodsRepository.GetExpiredGoodsForDisposal();
            if (expiredGoodsList.IsNullOrEmpty()) return ("Không có sản phẩm nào hết hạn trong kho.".ToMessageForUser(), null);

            var committedDetails = await _disposalRequestRepository.GetCommittedDisposalQuantities();

            var resultDtoList = new List<ExpiredGoodsDisposalDto>();
            foreach (var item in expiredGoodsList)
            {
                int onHandQuantity = item.TotalExpiredPackageQuantity;

                int committedQuantity = committedDetails
                    .Where(d => d.GoodsId == item.Goods.GoodsId && d.GoodsPackingId == item.GoodsPacking.GoodsPackingId)
                    .Sum(d => d.PackageQuantity ?? 0);

                int availableQuantity = onHandQuantity - committedQuantity;

                if (availableQuantity > 0)
                {
                    var goodsDto = _mapper.Map<GoodsDto>(item.Goods);
                    var goodsPackingDto = _mapper.Map<GoodsPackingDto>(item.GoodsPacking);

                    resultDtoList.Add(new ExpiredGoodsDisposalDto
                    {
                        Goods = goodsDto,
                        GoodsPacking = goodsPackingDto,
                        TotalExpiredPackageQuantity = availableQuantity
                    });
                }
            }

            if (!resultDtoList.Any()) return ("Không có sản phẩm hết hạn nào khả dụng để xuất hủy.".ToMessageForUser(), null);

            return ("", resultDtoList);
        }

        public async Task<(string, DisposalRequestCreateDto?)> CreateDisposalRequest(DisposalRequestCreateDto createDto, int? userId)
        {
            if (createDto == null) return ("Data disposal request create is null.", null);

            if (createDto.EstimatedTimeDeparture <= DateOnly.FromDateTime(DateTime.Now))
                return ("Ngày xuất hủy không hợp lệ. Vui lòng chọn một ngày trong tương lai.".ToMessageForUser(), null);

            if (createDto.DisposalRequestItems.IsNullOrEmpty())
                return ("Danh sách hàng hóa không được bỏ trống.".ToMessageForUser(), null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var disposalRequest = _mapper.Map<DisposalRequest>(createDto);
                disposalRequest.DisposalRequestId = PrimaryKeyUtility.GenerateKey("DIS", "DR");
                disposalRequest.CreatedBy = userId;

                await _disposalRequestRepository.CreateDisposalRequest(disposalRequest);

                await _unitOfWork.CommitTransactionAsync();
                return ("", createDto);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Tạo yêu cầu xuất hủy thất bại.".ToMessageForUser(), null);
            }
        }
    }
}
