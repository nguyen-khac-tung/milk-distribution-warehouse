import React from 'react';

// Hook để check fields có trong data và quyết định hiển thị filter
export const useFilterDisplayLogic = (purchaseOrders) => {
  const availableFieldsForFilter = React.useMemo(() => {
    if (!purchaseOrders || purchaseOrders.length === 0) {
      return {
        hasSupplier: false,
        hasApprovalBy: false,
        hasCreatedBy: false,
        hasArrivalConfirmedBy: false,
        hasAssignTo: false
      };
    }

    const firstItem = purchaseOrders[0];
    return {
      hasSupplier: firstItem.supplierName !== undefined || firstItem.supplierId !== undefined,
      hasApprovalBy: firstItem.approvalBy !== undefined || firstItem.approvalByName !== undefined,
      hasCreatedBy: firstItem.createdBy !== undefined || firstItem.createdByName !== undefined,
      hasArrivalConfirmedBy: firstItem.arrivalConfirmedBy !== undefined || firstItem.arrivalConfirmedByName !== undefined,
      hasAssignTo: firstItem.assignTo !== undefined || firstItem.assignToName !== undefined
    };
  }, [purchaseOrders]);

  return availableFieldsForFilter;
};

// Component wrapper để inject filter logic
export const FilterDisplayWrapper = ({ 
  children, 
  purchaseOrders, 
  render 
}) => {
  const availableFields = useFilterDisplayLogic(purchaseOrders);
  
  if (render) {
    return render(availableFields);
  }
  
  return React.cloneElement(children, { availableFields });
};

export default useFilterDisplayLogic;
