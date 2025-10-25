using AutoMapper;
using AutoMapper.QueryableExtensions;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using MilkDistributionWarehouse.Constants;
using MilkDistributionWarehouse.Models.DTOs;
using MilkDistributionWarehouse.Models.Entities;
using MilkDistributionWarehouse.Repositories;
using MilkDistributionWarehouse.Utilities;
using System.ComponentModel.Design;
using System.Threading.Tasks;
using static Microsoft.EntityFrameworkCore.DbLoggerCategory;

namespace MilkDistributionWarehouse.Services
{
    public interface ISupplierService
    {
        Task<(string, PageResult<SupplierDto>)> GetSuppliers(PagedRequest request);
        Task<(string, SupplierDetail)> GetSupplierBySupplierId(int supplierId);
        Task<(string, SupplierDetail)> CreateSupplier(SupplierCreate create);
        Task<(string, SupplierDetail)> UpdateSupplier(SupplierUpdate update);
        Task<(string, SupplierDetail)> DeleteSupplier(int supplierId);
        Task<(string, SupplierUpdateStatusDto)> UpdateSupplierStatus(SupplierUpdateStatusDto update);
        Task<(string, List<SupplierDropDown>)> GetSupplierDropDown();
    }
    public class SupplierService : ISupplierService
    {
        private readonly ISupplierRepository _supplierRepository;
        private readonly IMapper _mapper;
        private readonly IGoodsRepository _goodsRepository;
        private readonly IPurchaseOrderRepositoy _purchaseOrderRepository;
        public SupplierService(ISupplierRepository supplierRepository, IMapper mapper,
            IGoodsRepository goodsRepository, IPurchaseOrderRepositoy purchaseOrderRepository)
        {
            _supplierRepository = supplierRepository;
            _mapper = mapper;
            _goodsRepository = goodsRepository;
            _purchaseOrderRepository = purchaseOrderRepository;
        }

        public async Task<(string, PageResult<SupplierDto>)> GetSuppliers(PagedRequest request)
        {
            var query = _supplierRepository.GetSuppliers();

            var supplierDtos = query.ProjectTo<SupplierDto>(_mapper.ConfigurationProvider);

            var items = await supplierDtos.ToPagedResultAsync(request);

            if (!items.Items.Any())
                return ("Danh sách nhà cung cấp trống.".ToMessageForUser(), new PageResult<SupplierDto>());

            return ("", items);
        }

        public async Task<(string, List<SupplierDropDown>)> GetSupplierDropDown()
        {
            var query = await _supplierRepository.GetSuppliers()
                .Where(s => s.Status == CommonStatus.Active)
                .ToListAsync();

            var supplierDropDown = _mapper.Map<List<SupplierDropDown>>(query);

            if (!supplierDropDown.Any()) return ("Danh sách nhà cung cấp trống.".ToMessageForUser(), new List<SupplierDropDown>());
            return ("", supplierDropDown);
        }

        public async Task<(string, SupplierDetail)> GetSupplierBySupplierId(int supplierId)
        {
            if (supplierId <= 0)
                return ("SupplierId is invalid.", new SupplierDetail());

            var supplier = await _supplierRepository.GetSupplierBySupplierId(supplierId);

            if (supplier == null)
                return ("Không tìm thấy nhà cung cấp.".ToMessageForUser(), new SupplierDetail());

            var canUpdateAllFields = await _purchaseOrderRepository.IsAllPurchaseOrderDraftOrEmpty(supplierId);

            var supplierDetail = _mapper.Map<SupplierDetail>(supplier);

            supplierDetail.IsDisable = true ? !canUpdateAllFields : false;

            return ("", supplierDetail);
        }

        public async Task<(string, SupplierDetail)> CreateSupplier(SupplierCreate create)
        {
            if (create == null)
                return ("Data supplier create is null.", new SupplierDetail());

            var validation = await ValidationSupplier(null, create);

            if (!string.IsNullOrEmpty(validation))
                return (validation.ToMessageForUser(), new SupplierDetail());

            var supplier = _mapper.Map<Supplier>(create);

            var createResult = await _supplierRepository.CreateSupplier(supplier);

            if (createResult == null)
                return ("Thêm mới nhà cung cấp thất bại.".ToMessageForUser(), new SupplierDetail());

            return ("", _mapper.Map<SupplierDetail>(createResult));
        }

        public async Task<(string, SupplierDetail)> UpdateSupplier(SupplierUpdate update)
        {
            if (update == null)
                return ("Data supplier update is null", new SupplierDetail());

            var supplierExist = await _supplierRepository.GetSupplierBySupplierId(update.SupplierId);

            if (supplierExist == null) return ("Supllier is not exist.", new SupplierDetail());

            var supplierValidation = _mapper.Map<SupplierCreate>(update);

            var validation = await ValidationSupplier(update.SupplierId, supplierValidation);

            if (!string.IsNullOrEmpty(validation))
                return (("Cập nhật thất bại. " + validation.ToMessageForUser()), new SupplierDetail());

            //Check update
            var canUpdateAllFields = await _purchaseOrderRepository.IsAllPurchaseOrderDraftOrEmpty(update.SupplierId);

            if (canUpdateAllFields)
            {
                supplierExist.CompanyName = update.CompanyName;
                supplierExist.BrandName = update.BrandName;
                supplierExist.TaxCode = update.TaxCode;
                supplierExist.Address = update.Address;
                supplierExist.Email = update.Email;
                supplierExist.Phone = update.Phone;
            }

            supplierExist.BrandName = update.BrandName;
            supplierExist.Email = update.Email;
            supplierExist.Phone = update.Phone;
            supplierExist.ContactPersonName = update.ContactPersonName;
            supplierExist.ContactPersonPhone = update.ContactPersonPhone;
            supplierExist.ContactPersonEmail = update.ContactPersonEmail;
            supplierExist.UpdatedAt = DateTime.Now;

            var updateResult = await _supplierRepository.UpdateSupplier(supplierExist);

            if (updateResult == null)
                return ("Cập nhật nhà cung cập thất bại".ToMessageForUser(), new SupplierDetail());

            return ("", _mapper.Map<SupplierDetail>(updateResult));
        }

        public async Task<(string, SupplierUpdateStatusDto)> UpdateSupplierStatus(SupplierUpdateStatusDto update)
        {
            if (update.SupplierId <= 0) return ("SupplierId is invalid.", new SupplierUpdateStatusDto());

            var supplierExist = await _supplierRepository.GetSupplierBySupplierId(update.SupplierId);
            if (supplierExist == null) return ("Supplier is not exist.", new SupplierUpdateStatusDto());

            if (supplierExist.Status == update.Status)
                return ("Supplier status is not change", new SupplierUpdateStatusDto());

            // Check chuyen trang thai Active => InActive
            var changeStatus = supplierExist.Status == CommonStatus.Active && update.Status == CommonStatus.Inactive;

            if (changeStatus)
            {
                var checkChangeStatus = await CheckChangeStatus(update.SupplierId);
                if (!string.IsNullOrEmpty(checkChangeStatus))
                    return (checkChangeStatus.ToMessageForUser(), new SupplierUpdateStatusDto());
            }

            supplierExist.Status = update.Status;
            supplierExist.UpdatedAt = DateTime.Now;

            var updateStatusResult = await _supplierRepository.UpdateSupplier(supplierExist);
            if (updateStatusResult == null)
                return ("Cập nhật trạng thái nhà cung cấp thất bại.".ToMessageForUser(), new SupplierUpdateStatusDto());

            return ("", update);
        }

        public async Task<(string, SupplierDetail)> DeleteSupplier(int supplierId)
        {
            if (supplierId <= 0) return ("SupplierId is invalid.", new SupplierDetail());

            var supplierExist = await _supplierRepository.GetSupplierBySupplierId(supplierId);

            if (supplierExist == null) return ("Supplier is not found.", new SupplierDetail());

            var canDelete = await _purchaseOrderRepository.HasActivePurchaseOrder(supplierId);
            if (canDelete)
                return ("Không thể xoá nhà cung cấp do đang có đơn đặt hàng đang xử lý.".ToMessageForUser(), new SupplierDetail());

            var checkGoodsActiveOrInactive = await _goodsRepository.IsGoodsActiveOrInActive(supplierId);
            if (checkGoodsActiveOrInactive)
                return ("Không thể xoá nhà cung cấp do đang có sản phẩm đang hoạt động hoặc vô hiệu hoá.".ToMessageForUser(), new SupplierDetail());

            supplierExist.Status = CommonStatus.Deleted;
            supplierExist.UpdatedAt = DateTime.Now;

            var deleteResult = await _supplierRepository.UpdateSupplier(supplierExist);
            if (deleteResult == null) return ("Xoá nhà cung cấp thất bại.".ToMessageForUser(), new SupplierDetail());

            return ("", _mapper.Map<SupplierDetail>(supplierExist));

        }

        private async Task<string> ValidationSupplier(int? supplierId, SupplierCreate create)
        {
            var checkCompanyName = await _supplierRepository.IsDuplicationCompanyName(supplierId, create.CompanyName);
            if (checkCompanyName) return "Tên công ty đã tồn tại trong hệ thống.";

            var checkBrandName = await _supplierRepository.IsDuplicationBrandName(supplierId, create.BrandName);
            if (checkBrandName) return "Tên thương hiệu đã tồn tại trong hệ thống.";

            var checkTaxCode = await _supplierRepository.IsDuplicationTaxCode(supplierId, create.TaxCode);
            if (checkTaxCode) return "Mã số thuế đã tồn tại trong hệ thống.";

            var checkEmail = await _supplierRepository.IsDuplicationEmail(supplierId, create.Email);
            if (checkEmail) return "Email đã tồn tại trong hệ thống.";

            var checkPhone = await _supplierRepository.IsDuplicationPhone(supplierId, create.Phone);
            if (checkPhone) return "Số điện thoại đã tồn tại trong hệ thống.";

            return "";
        }

        private async Task<string> CheckChangeStatus(int supplier)
        {
            var checkPurchaseOrder = await _purchaseOrderRepository.HasActivePurchaseOrder(supplier);
            if (checkPurchaseOrder) return "Tồn tại đơn đặt hàng đang hoạt động trong hệ thống.";

            var checkGoods = await _goodsRepository.HasActiveGoods(supplier);
            if (checkGoods) return "Tồn tại sản phẩm đang hoạt động trong hệ thống.";

            return "";
        }
    }
}
