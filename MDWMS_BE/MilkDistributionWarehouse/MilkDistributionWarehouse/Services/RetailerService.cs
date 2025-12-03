using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface IRetailerService
    {
        Task<(string, PageResult<RetailerDto>)> GetRetailers(PagedRequest request);
        Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId);
        Task<(string, RetailerDetail)> CreateRetailer(RetailerCreate create);
        Task<(string, RetailerDetail)> UpdateRetailer(RetailerUpdate update);
        Task<(string, RetailerDetail)> DeleteRetailer(int retailerId);
        Task<(string, List<RetailerDropDown>)> GetRetailerDropDown();
        Task<(string, List<RetailerDropDown>)> GetAllRetailerDropDown();
        Task<(string, RetailerUpdateStatus)> UpdateRetailerStatus(RetailerUpdateStatus update);
    }
    public class RetailerService : IRetailerService
    {
        private readonly IRetailerRepository _retailerRepository;
        private readonly IMapper _mapper;
        private readonly ISalesOrderRepository _salesOrderRepository;
        public RetailerService(IRetailerRepository retailerRepository, IMapper mapper, ISalesOrderRepository salesOrderRepository)
        {
            _retailerRepository = retailerRepository;
            _mapper = mapper;
            _salesOrderRepository = salesOrderRepository;
        }

        public async Task<(string, PageResult<RetailerDto>)> GetRetailers(PagedRequest request)
        {
            var retailerQuery = _retailerRepository.GetRetailers();

            var retailerDtos = retailerQuery.ProjectTo<RetailerDto>(_mapper.ConfigurationProvider);

            var items = await retailerDtos.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách nhà bán lẻ trống.".ToMessageForUser(), new PageResult<RetailerDto>());

            return ("", items);
        }

        public async Task<(string, List<RetailerDropDown>)> GetRetailerDropDown()
        {
            var retailerQuery = await _retailerRepository.GetRetailers()
                .Where(r => r.Status == CommonStatus.Active)
                .ToListAsync();

            var retailsDropDown = _mapper.Map<List<RetailerDropDown>>(retailerQuery);

            if (!retailsDropDown.Any())
                return ("Danh sách nhà bán lẻ trống.", new List<RetailerDropDown>());

            return ("", retailsDropDown);
        }

        public async Task<(string, List<RetailerDropDown>)> GetAllRetailerDropDown()
        {
            var retailerQuery = await _retailerRepository.GetRetailers().ToListAsync();

            var retailsDropDown = _mapper.Map<List<RetailerDropDown>>(retailerQuery);

            if (!retailsDropDown.Any())
                return ("Danh sách nhà bán lẻ trống.", new List<RetailerDropDown>());

            return ("", retailsDropDown);
        }

        public async Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId)
        {
            if (retailerId <= 0)
                return ("RetailerId is invalid.", new RetailerDetail());

            var retailer = await _retailerRepository.GetRetailerByRetailerId(retailerId);

            if (retailer == null)
                return ("Không tìm thấy nhà bán lẻ.".ToMessageForUser(), new RetailerDetail());

            var retailerDetail = _mapper.Map<RetailerDetail>(retailer);
            retailerDetail.IsDisable = !await _salesOrderRepository.IsAllSalesOrderDraffOrEmpty(retailerId);

            return ("", retailerDetail);
        }

        public async Task<(string, RetailerDetail)> CreateRetailer(RetailerCreate create)
        {
            if (create == null) return ("Data retailer create is null", new RetailerDetail());

            var validationRetailer = await ValidationRetailer(null, create);
            if (!string.IsNullOrEmpty(validationRetailer))
                return (validationRetailer.ToMessageForUser(), new RetailerDetail());

            var retailer = _mapper.Map<Retailer>(create);

            var createResult = await _retailerRepository.CreateRetailer(retailer);
            if (createResult == null)
                return ("Thêm mới nhà bán lẻ thất bại.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(createResult));
        }

        public async Task<(string, RetailerDetail)> UpdateRetailer(RetailerUpdate update)
        {
            if (update == null) return ("Data retailer update is null.", new RetailerDetail());

            var retailerExist = await _retailerRepository.GetRetailerByRetailerId(update.RetailerId);
            if (retailerExist == null) return ("Retailer is not exist.", new RetailerDetail());

            var validationRetailer = await ValidationRetailer(update.RetailerId, update);
            if (!string.IsNullOrEmpty(validationRetailer))
                return (("Không thể cập nhật nhà bán lẻ. " + validationRetailer).ToMessageForUser(), new RetailerDetail());

            var canUpdate = await _salesOrderRepository.IsAllSalesOrderDraffOrEmpty(update.RetailerId);
            if (canUpdate)
            {
                retailerExist.RetailerName = update.RetailerName;
                retailerExist.TaxCode = update.TaxCode;
                retailerExist.Email = update.Email;
                retailerExist.Address = update.Address;
                retailerExist.Phone = update.Phone;
            }

            retailerExist.Email = update.Email;
            retailerExist.Phone = update.Phone;
            retailerExist.UpdatedAt = DateTimeUtility.Now();

            var updateResult = await _retailerRepository.UpdateRetailer(retailerExist);
            if (updateResult == null)
                return ("Cập nhật nhà bán lẻ thất bại.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(retailerExist));
        }

        public async Task<(string, RetailerUpdateStatus)> UpdateRetailerStatus(RetailerUpdateStatus update)
        {
            if (update.RetailerId <= 0)
                return ("RetailerId is not invalid", new RetailerUpdateStatus());

            var retailerExist = await _retailerRepository.GetRetailerByRetailerId(update.RetailerId);
            if (retailerExist == null) return ("Retailer is not exist.", new RetailerUpdateStatus());

            if (retailerExist.Status == CommonStatus.Deleted && update.Status == CommonStatus.Deleted)
                return ("Nhà bán lẻ đã bị xoá trước đó.".ToMessageForUser(), new RetailerUpdateStatus());

            if (retailerExist.Status == update.Status)
                return ("Trạng thái nhà bán lẻ không có gì thay đổi.".ToMessageForUser(), new RetailerUpdateStatus());

            var validationMessage = await ValidationStatusChange(retailerExist, update.Status);
            if (!string.IsNullOrEmpty(validationMessage))
                return (validationMessage.ToMessageForUser(), new RetailerUpdateStatus());

            retailerExist.Status = update.Status;
            retailerExist.UpdatedAt = DateTimeUtility.Now();

            var updateResult = await _retailerRepository.UpdateRetailer(retailerExist);
            if (updateResult == null) return ("Cập nhật trạng thái nhà bán lẻ thất bại.", new RetailerUpdateStatus());

            return ("", update);
        }

        public async Task<(string, RetailerDetail)> DeleteRetailer(int retailerId)
        {
            if (retailerId <= 0) return ("RetailerId is invalid.", new RetailerDetail());

            var retailerExist = await _retailerRepository.GetRetailerByRetailerId(retailerId);
            if (retailerExist == null) return ("Retailer is not exist.", new RetailerDetail());

            var canNotDelete = await _salesOrderRepository.HasActiveSalesOrder(retailerId);
            if (canNotDelete)
                return ("Không thể xoá nhà bán lẻ vì tồn tại đơn mua hàng đang xử lý.".ToMessageForUser(), new RetailerDetail());

            retailerExist.Status = CommonStatus.Deleted;
            retailerExist.UpdatedAt = DateTimeUtility.Now();

            var deleteResult = await _retailerRepository.UpdateRetailer(retailerExist);
            if (deleteResult == null) return ("Xoá nhà bán lẻ thất bại.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(retailerExist));
        }

        private async Task<string> ValidationRetailer(int? retailerId, RetailerCreate create)
        {
            var checkRetailerName = await _retailerRepository.IsDupliationRetailerName(retailerId, create.RetailerName);
            if (checkRetailerName) return "Tên nhà bán lẻ đã tồn tại trong hệ thống.";

            var checkTaxCode = await _retailerRepository.IsDuplicationTaxCode(retailerId, create.TaxCode);
            if (checkTaxCode) return "Mã số thuế đã tồn tại trong hệ thống.";

            var checkPhone = await _retailerRepository.IsDuplicationPhone(retailerId, create.Phone);
            if (checkPhone) return "Số điện thoại đã tồn tại trong hệ thống.";

            var checkEmail = await _retailerRepository.IsDuplicationEmail(retailerId, create.Email);
            if (checkEmail) return "Email đã tồn tại trong hệ thống.";

            return "";
        }

        private async Task<string> CheckChangeStatus(int retailerId)
        {
            var checkSalesOrder = await _salesOrderRepository.HasActiveSalesOrder(retailerId);
            if (checkSalesOrder) return "Tồn tại đơn mua đang xử lý trong hệ thống.";

            return "";
        }

        private async Task<string> ValidationStatusChange(Retailer retailer, int newStatus)
        {
            if (retailer.Status == CommonStatus.Active && newStatus == CommonStatus.Inactive)
            {
                var reason = await CheckChangeStatus(retailer.RetailerId);
                if (!string.IsNullOrEmpty(reason))
                    return $"Không thể cập nhật nhà bán lẻ. {reason}";
            }

            return string.Empty;
        }

    }
}
