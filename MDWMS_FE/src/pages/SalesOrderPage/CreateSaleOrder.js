import React from 'react'

import { createSaleOrder, updateSaleOrder, getSalesOrderDetail } from "../../services/SalesOrderService"
import { getRetailersDropdown } from "../../services/RetailerService";
import { getSuppliersDropdown } from "../../services/SupplierService"
import { getGoodsDropDownBySupplierId, getGoodsPackingByGoodsId } from "../../services/PurchaseOrderService"

const CreateSaleOrder = () => {
    return (
        <div>CreateSaleOrder</div>
    )
}

export default CreateSaleOrder