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
        Task<(string, DisposalRequestUpdateDto?)> UpdateDisposalRequest(DisposalRequestUpdateDto updateDto, int? userId);
        Task<string> DeleteDisposalRequest(string? disposalRequestId, int? userId);
        Task<(string, T?)> UpdateStatusDisposalRequest<T>(T updateStatusDto, int? userId) where T : DisposalRequestUpdateStatusDto;
    }

    public class DisposalRequestService : IDisposalRequestService
    {
        private readonly IDisposalRequestRepository _disposalRequestRepository;
        private readonly IDisposalRequestDetailRepository _disposalRequestDetailRepository;
        private readonly IUserRepository _userRepository;
        private readonly IGoodsRepository _goodsRepository;
        private readonly INotificationService _notificationService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;

        public DisposalRequestService(IDisposalRequestRepository disposalRequestRepository,
                                      IDisposalRequestDetailRepository disposalRequestDetailRepository,
                                      IUserRepository userRepository,
                                      IGoodsRepository goodsRepository,
                                      INotificationService notificationService,
                                      IUnitOfWork unitOfWork,
                                      IMapper mapper)
        {
            _disposalRequestRepository = disposalRequestRepository;
            _disposalRequestDetailRepository = disposalRequestDetailRepository;
            _userRepository = userRepository;
            _goodsRepository = goodsRepository;
            _notificationService = notificationService;
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

        public async Task<(string, DisposalRequestUpdateDto?)> UpdateDisposalRequest(DisposalRequestUpdateDto updateDto, int? userId)
        {
            if (updateDto == null) return ("Data disposal request update is null.", null);

            if (updateDto.EstimatedTimeDeparture <= DateOnly.FromDateTime(DateTime.Now))
                return ("Ngày xuất hủy không hợp lệ. Vui lòng chọn một ngày trong tương lai.".ToMessageForUser(), null);

            if (updateDto.DisposalRequestItems.IsNullOrEmpty())
                return ("Danh sách hàng hóa không được bỏ trống.".ToMessageForUser(), null);

            var existingRequest = await _disposalRequestRepository.GetDisposalRequestById(updateDto.DisposalRequestId);
            if (existingRequest == null) return ("Disposal request exist is null.", null);

            if (existingRequest.Status != DisposalRequestStatus.Draft && existingRequest.Status != DisposalRequestStatus.Rejected)
                return ("Chỉ được cập nhật khi yêu cầu ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser(), null);

            if (existingRequest.CreatedBy != userId) return ("Bạn không có quyền cập nhật yêu cầu này.".ToMessageForUser(), null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                _mapper.Map(updateDto, existingRequest);
                existingRequest.UpdateAt = DateTime.Now;

                var updateDetails = updateDto.DisposalRequestItems;
                var existingDetails = existingRequest.DisposalRequestDetails.ToList();

                foreach (var exDetail in existingDetails)
                {
                    if (!updateDetails.Any(up => up.DisposalRequestDetailId == exDetail.DisposalRequestDetailId))
                    {
                        await _disposalRequestDetailRepository.Remove(exDetail);
                    }
                }

                foreach (var updateDetail in updateDetails)
                {
                    var existingDetail = existingDetails.FirstOrDefault(ex => ex.DisposalRequestDetailId == updateDetail.DisposalRequestDetailId);
                    if (existingDetail != null)
                    {
                        _mapper.Map(updateDetail, existingDetail);
                    }
                    else
                    {
                        var newDetail = _mapper.Map<DisposalRequestDetail>(updateDetail);
                        existingRequest.DisposalRequestDetails.Add(newDetail);
                    }
                }

                await _disposalRequestRepository.UpdateDisposalRequest(existingRequest);
                await _unitOfWork.CommitTransactionAsync();

                return ("", updateDto);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Cập nhật yêu cầu xuất hủy thất bại.".ToMessageForUser(), null);
            }
        }

        public async Task<string> DeleteDisposalRequest(string? disposalRequestId, int? userId)
        {
            if (string.IsNullOrEmpty(disposalRequestId)) return "DisposalRequestId is invalid.";

            var existingRequest = await _disposalRequestRepository.GetDisposalRequestById(disposalRequestId);
            if (existingRequest == null) return "Disposal request exist is null.";

            if (existingRequest.CreatedBy != userId) return "Bạn không có quyền xóa yêu cầu này.".ToMessageForUser();

            if (existingRequest.Status != DisposalRequestStatus.Draft) return "Chỉ có thể xóa khi yêu cầu ở trạng thái Nháp.".ToMessageForUser();

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                foreach (var item in existingRequest.DisposalRequestDetails.ToList())
                {
                    await _disposalRequestDetailRepository.Remove(item);
                }

                await _disposalRequestRepository.DeleteDisposalRequest(existingRequest);

                await _unitOfWork.CommitTransactionAsync();
                return "";
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return "Xóa yêu cầu xuất hủy thất bại.".ToMessageForUser();
            }
        }

        public async Task<(string, T?)> UpdateStatusDisposalRequest<T>(T updateStatusDto, int? userId)
            where T : DisposalRequestUpdateStatusDto
        {
            var disposalRequest = await _disposalRequestRepository.GetDisposalRequestById(updateStatusDto.DisposalRequestId);
            if (disposalRequest == null) return ("Disposal request exist is null.", null);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (updateStatusDto is DisposalRequestPendingApprovalDto)
                {
                    if (disposalRequest.Status != DisposalRequestStatus.Draft && disposalRequest.Status != DisposalRequestStatus.Rejected)
                        return ("Chỉ được nộp khi yêu cầu ở trạng thái Nháp hoặc Bị từ chối.".ToMessageForUser(), null);
                    if (disposalRequest.CreatedBy != userId) return ("Bạn không có quyền thực hiện thao tác này.".ToMessageForUser(), null);

                    disposalRequest.Status = DisposalRequestStatus.PendingApproval;
                }

                if (updateStatusDto is DisposalRequestRejectDto rejectDto)
                {
                    if (disposalRequest.Status != DisposalRequestStatus.PendingApproval)
                        return ("Chỉ được từ chối khi yêu cầu ở trạng thái Chờ duyệt.".ToMessageForUser(), null);
                    disposalRequest.Status = DisposalRequestStatus.Rejected;
                    disposalRequest.ApprovalBy = userId;
                    disposalRequest.RejectionReason = rejectDto.RejectionReason;
                    disposalRequest.ApprovalAt = DateTime.Now;
                }

                if (updateStatusDto is DisposalRequestApprovalDto)
                {
                    if (disposalRequest.Status != DisposalRequestStatus.PendingApproval)
                        return ("Chỉ được duyệt khi yêu cầu ở trạng thái Chờ duyệt.".ToMessageForUser(), null);
                    disposalRequest.Status = DisposalRequestStatus.Approved;
                    disposalRequest.ApprovalBy = userId;
                    disposalRequest.RejectionReason = "";
                    disposalRequest.ApprovalAt = DateTime.Now;
                }

                if (updateStatusDto is DisposalRequestAssignedForPickingDto assignedDto)
                {
                    if (disposalRequest.Status != DisposalRequestStatus.Approved && disposalRequest.Status != DisposalRequestStatus.AssignedForPicking)
                        return ("Chỉ được phân công khi yêu cầu ở trạng thái Đã duyệt hoặc Đã phân công.".ToMessageForUser(), null);
                    disposalRequest.Status = DisposalRequestStatus.AssignedForPicking;
                    disposalRequest.AssignTo = assignedDto.AssignTo;
                    disposalRequest.AssignAt = DateTime.Now;
                }

                disposalRequest.UpdateAt = DateTime.Now;
                await _disposalRequestRepository.UpdateDisposalRequest(disposalRequest);
                await _unitOfWork.CommitTransactionAsync();

                await HandleStatusChangeNotification(disposalRequest);
                return ("", updateStatusDto);
            }
            catch
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ("Cập nhật trạng thái yêu cầu xuất hủy thất bại.".ToMessageForUser(), null);
            }
        }

        private async Task HandleStatusChangeNotification(DisposalRequest disposalRequest)
        {
            var notificationsToCreate = new List<NotificationCreateDto>();

            switch (disposalRequest.Status)
            {
                case DisposalRequestStatus.PendingApproval:
                    var saleManagers = await _userRepository.GetUsersByRoleId(RoleType.SaleManager);
                    foreach (var manager in saleManagers ?? new List<User>())
                    {
                        notificationsToCreate.Add(new NotificationCreateDto()
                        {
                            UserId = disposalRequest.ApprovalBy,
                            Title = "Yêu cầu xuất hủy mới chờ duyệt",
                            Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' vừa được gửi và đang chờ bạn duyệt.",
                            EntityType = NotificationEntityType.DisposalRequest,
                            EntityId = disposalRequest.DisposalRequestId
                        });
                    }
                    break;

                case DisposalRequestStatus.Approved:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.CreatedBy,
                        Title = "Yêu cầu xuất hủy đã được duyệt",
                        Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' của bạn đã được duyệt.",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId
                    });
                    break;

                case DisposalRequestStatus.Rejected:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.CreatedBy,
                        Title = "Yêu cầu xuất hủy của bạn bị từ chối",
                        Content = $"Yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}' đã bị từ chối. Lý do: {disposalRequest.RejectionReason}",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId,
                        Category = NotificationCategory.Important
                    });
                    break;

                case DisposalRequestStatus.AssignedForPicking:
                    notificationsToCreate.Add(new NotificationCreateDto()
                    {
                        UserId = disposalRequest.AssignTo,
                        Title = "Bạn được phân công một yêu cầu xuất hủy mới",
                        Content = $"Bạn vừa được phân công để soạn hàng cho yêu cầu xuất hủy '{disposalRequest.DisposalRequestId}'.",
                        EntityType = NotificationEntityType.DisposalRequest,
                        EntityId = disposalRequest.DisposalRequestId,
                        Category = NotificationCategory.Important
                    });
                    break;

                default: break;
            }

            if (notificationsToCreate.Count > 0)
                await _notificationService.CreateNotificationBulk(notificationsToCreate);
        }
    }
}
