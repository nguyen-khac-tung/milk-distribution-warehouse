using AutoMapper;
using AutoMapper.QueryableExtensions;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IStocktakingSheetService
    {
        Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId);
        Task<(string, StocktakingSheetCreateResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId);
    }
    public class StocktakingSheetService : IStocktakingSheetService
    {
        private readonly IMapper _mapper;
        private readonly IStocktakingSheetRepository _stocktakingSheetRepository;
        private readonly IStocktakingAreaRepository _stocktakingAreaRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IAreaRepository _areaRepository;
        public StocktakingSheetService(IMapper mapper, IStocktakingSheetRepository stocktakingSheetRepository,
            IStocktakingAreaRepository stocktakingAreaRepository,
            IUnitOfWork unitOfWork, IAreaRepository areaRepository)
        {
            _mapper = mapper;
            _stocktakingSheetRepository = stocktakingSheetRepository;
            _stocktakingAreaRepository = stocktakingAreaRepository;
            _unitOfWork = unitOfWork;
            _areaRepository = areaRepository;
        }

        public async Task<(string, PageResult<StocktakingSheetDto>?)> GetStocktakingSheets(PagedRequest request, string roleName, int? userId)
        {
            var stocktakingSheetQuery = _stocktakingSheetRepository.GetStocktakingSheet();

            switch (roleName)
            {
                case RoleNames.WarehouseManager:

                    break;
                case RoleNames.SalesManager:
                    var status = new int[]
                    {
                        StocktakingStatus.Approved,
                        StocktakingStatus.Completed
                    };
                    stocktakingSheetQuery = stocktakingSheetQuery.Where(ss => status.Contains((int)ss.Status));
                    break;
                case RoleNames.WarehouseStaff:
                    var excludedStatus = new int[]
                    {
                        StocktakingStatus.Draft,
                        StocktakingStatus.Cancelled
                    };
                    stocktakingSheetQuery = stocktakingSheetQuery.Where(ss => ss.StocktakingAreas
                                                .Any(sa => userId.HasValue
                                                && sa.AssignTo == userId)
                                                && !excludedStatus.Contains((int)ss.Status));
                    break;
                default:
                    return ("Bạn không có quyền xem danh sách kiểm kê.", default);
            }

            var stocktakingSheetMap = stocktakingSheetQuery.ProjectTo<StocktakingSheetDto>(_mapper.ConfigurationProvider);

            var items = await stocktakingSheetMap.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách phiếu kiểm kê trống.".ToMessageForUser(), default);

            return ("", items);
        }

        public async Task<(string, StocktakingSheetCreateResponse?)> CreateStocktakingSheet(StocktakingSheetCreate create, int? userId)
        {
            if (create == null) return ("Dữ liệu tạo phiếu kiểm kê trống.", default);

            if (userId == null) return ("Bạn không có quyền tạo phiếu kiểm kê.", default);

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                if (create.StartTime <= DateTime.Now)
                    throw new Exception("Thời gian bắt đầu phải là thời gian trong thương lai.");

                var isDuplicationStartTime = await _stocktakingSheetRepository.IsDuplicationStartTimeStocktakingSheet(null, create.StartTime);
                if (isDuplicationStartTime)
                    throw new Exception("Thời gian bắt đầu kiểm kê đã tồn tại ở một phiếu kiểm kê khác.");

                var stocktakingSheetMap = _mapper.Map<StocktakingSheet>(create);

                var validationStocktakingAreas = await ValidationListStocktakingAreas(create.StocktakingAreaCreates);

                if (!string.IsNullOrEmpty(validationStocktakingAreas))
                    throw new Exception(validationStocktakingAreas);

                var stocktakingAreaMaps = _mapper.Map<List<StocktakingArea>>(create.StocktakingAreaCreates);

                stocktakingSheetMap.StocktakingAreas = stocktakingAreaMaps;
                stocktakingSheetMap.CreatedBy = userId;

                var resultCreate = await _stocktakingSheetRepository.CreateStocktakingSheet(stocktakingSheetMap);
                if (resultCreate == 0)
                    throw new Exception("Tạo phiếu nhập kho thất bại.");

                await _unitOfWork.CommitTransactionAsync();
                return ("", new StocktakingSheetCreateResponse { StocktakingSheetId = stocktakingSheetMap.StocktakingSheetId });
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackTransactionAsync();
                return ($"{ex.Message}".ToMessageForUser(), default);
            }
        }

        private async Task<string> ValidationListStocktakingAreas(List<StocktakingAreaCreate> areaCreates)
        {
            if (HasDuplicateAssigneeInSameSheet(areaCreates))
                return "Không thể phân công 2 nhân viên kho cùng 1 khu vực.";

            if (!(await CheckAllAssignAreaStocktaking(areaCreates)))
                return "Còn khu vực chưa được phân công nhân viên kiểm kê.";

            return "";
        }

        private bool HasDuplicateAssigneeInSameSheet(List<StocktakingAreaCreate> areas)
        {
            return areas.GroupBy(sa => sa.AssignTo)
                        .Any(g => g.Count() > 1);
        }

        private async Task<bool> CheckAllAssignAreaStocktaking(List<StocktakingAreaCreate> areaCreates)
        {
            var areas = await _areaRepository.GetActiveAreasAsync();

            return areas.All(area => areaCreates.Any(ac => ac.AreaId == area.AreaId && ac.AssignTo != null));
        }

    }
}
