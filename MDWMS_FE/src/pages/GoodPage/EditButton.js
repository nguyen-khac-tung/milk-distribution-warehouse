import React from "react";
import { Edit } from "lucide-react";
import PermissionWrapper from "../../components/Common/PermissionWrapper";
import { PERMISSIONS } from "../../utils/permissions";

const EditButton = ({ 
  good, 
  onUpdateClick, 
  className = "p-1.5 hover:bg-slate-100 rounded transition-colors",
  iconClassName = "h-4 w-4 text-orange-500",
  title = "Chỉnh sửa"
}) => {
  return (
    <PermissionWrapper requiredPermission={PERMISSIONS.GOODS_UPDATE}>
      <button
        className={className}
        title={title}
        onClick={() => onUpdateClick(good)}
      >
        <Edit className={iconClassName} />
      </button>
    </PermissionWrapper>
  );
};

export default EditButton;
