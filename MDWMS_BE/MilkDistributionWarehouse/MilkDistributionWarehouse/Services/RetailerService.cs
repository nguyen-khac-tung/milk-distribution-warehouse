using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.Threading.Tasks;

namespace MilkDistributionWarehouse.Services
{
    public interface IRetailerService
    {
        Task<(string, PageResult<RetailerDto>)> GetRetailers(PagedRequest request);
        Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId);
        Task<(string, RetailerDetail)> CreateRetailer(RetailerCreate create);
        Task<(string, RetailerDetail)> UpdateRetailer(RetailerUpdate update);
        Task<(string, RetailerDetail)> DeleteRetailer(int retailerId);
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

        public async Task<(string, RetailerDetail)> GetRetailerByRetailerId(int retailerId)
        {
            if (retailerId <= 0)
                return ("RetailerId is invalid.", new RetailerDetail());

            var retailer = await _retailerRepository.GetRetailerByRetailerId(retailerId);

            if (retailer == null)
                return ("Không tìm thấy nhà bán lẻ.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(retailer));
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

            var changeStatus = retailerExist.Status == CommonStatus.Active && update.Status == CommonStatus.Inactive;

            if (changeStatus)
            {
                var checkChangeStatus = await CheckChangeStatus(update.RetailerId);
                if (!string.IsNullOrEmpty(checkChangeStatus))
                    return (("Không thể cập nhật nhà bán lẻ. " + checkChangeStatus).ToMessageForUser(), new RetailerDetail());
            }

            var canUpdate = await _salesOrderRepository.IsAllSalesOrderDraffOrEmpty(update.RetailerId);
            if (canUpdate)
            {
                retailerExist.RetailerName = update.RetailerName;
                retailerExist.TaxCode = update.TaxCode;
                retailerExist.Email = update.Email;
                retailerExist.Address = update.Address;
                retailerExist.Phone = update.Phone;
            }
            else
            {
                retailerExist.Email = update.Email;
                retailerExist.Phone = update.Phone;
            }

            retailerExist.Status = update.Status;
            retailerExist.UpdatedAt = DateTime.Now;

            var updateResult = await _retailerRepository.UpdateRetailer(retailerExist);
            if (updateResult == null)
                return ("Cập nhật nhà bán lé thất bại.".ToMessageForUser(), new RetailerDetail());

            return ("", _mapper.Map<RetailerDetail>(retailerExist));
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
            retailerExist.UpdatedAt = DateTime.Now;

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

    }
}
