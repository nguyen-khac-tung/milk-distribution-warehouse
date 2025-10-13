// ComponentIcon.jsx
import React from "react";
import { Icon } from "@iconify/react";

export const IconMap = [
  { keywords: ['milk'], icon: 'tdesign:milk-filled' },
  { keywords: ['category'], icon: 'mdi:category-plus-outline' },
  { keywords: ['unitMeasure'], icon: 'fontisto:unity' },
  { keywords: ['storageCondition'], icon: 'f7:thermometer-snowflake' },
  { keywords: ['partner'], icon: 'mdi:partnership' },
  { keywords: ['retailer'], icon: 'emojione-monotone:department-store' },
  { keywords: ['supplier'], icon: 'emojione-monotone:factory' },
  { keywords: ['thermometer'], icon: 'meteocons:thermometer-sun-fill' },
  { keywords: ['package'], icon: 'mdi:package-variant' },
  { keywords: ['droplets'], icon: 'meteocons:thermometer-raindrop-fill' },
  { keywords: ['sun'], icon: 'fluent-color:weather-sunny-low-20' },
  { keywords: ['tag'], icon: 'streamline-sharp:star-badge' },
  { keywords: ['mapPin'], icon: 'fluent:location-ripple-20-filled' },
  { keywords: ['box'], icon: 'mdi:cube-outline' },
  { keywords: ['close'], icon: 'mdi:close' },
  { keywords: ['phone'], icon: 'line-md:phone-call-loop' },
  { keywords: ['email'], icon: 'flowbite:mail-box-outline' },
  { keywords: ['tax'], icon: 'streamline-freehand:receipt' },
  { keywords: ['calendar'], icon: 'mdi:calendar' },
  { keywords: ['building'], icon: 'emojione-monotone:office-building' },
  { keywords: ['qrcode'], icon: 'vaadin:qrcode' },
  { keywords: ['productVariant'], icon: 'fluent-mdl2:product-variant' },
  { keywords: ['streamlineplump'], icon: 'streamline-plump:graphic-template-website-ui-remix' },


  // có thể thêm nhiều icon khác ở đây
];

export const ComponentIcon = ({ name, color = "white", size = 20, collapsed = false }) => {
  const found = IconMap.find(item => item.keywords.includes(name));
  if (!found) return null;

  const isMilkIcon = name === 'milk';
  const isUnitMeasureIcon = name === 'unitMeasure';
  const isCategoryIcon = name === 'category';
  const isStorageCondition = name === 'storageCondition';
  const isPartnerIcon = name === 'partner';
  const isRetailerIcon = name === 'retailer';
  const isSupplierIcon = name === 'supplier';
  const isThermometerIcon = name === 'thermometer';
  const isPackageIcon = name === 'package';
  const isBuildingIcon = name === 'building';
  const isDropletsIcon = name === 'droplets';
  const isSunIcon = name === 'sun';
  const isTagIcon = name === 'tag';
  const isMapPinIcon = name === 'mapPin';
  const isBoxIcon = name === 'box';
  const isCloseIcon = name === 'close';
  const isQrcodeIcon = name === 'qrcode';
  const isProductVariantIcon = name === 'productVariant';
  const isPhoneIcon = name === 'phone';
  const isEmailIcon = name === 'email';
  const isTaxIcon = name === 'tax';
  const isCalendarIcon = name === 'calendar';
  const isStreamlineplumpIcon = name === 'streamlineplump';
  const needsSpecialAlignment = isMilkIcon || isUnitMeasureIcon || isCategoryIcon || isStorageCondition ||
    isPartnerIcon || isRetailerIcon || isSupplierIcon || isThermometerIcon ||
    isPackageIcon || isBuildingIcon || isDropletsIcon || isSunIcon || isTagIcon ||
    isMapPinIcon || isBoxIcon || isCloseIcon || isQrcodeIcon || isProductVariantIcon ||
    isPhoneIcon || isEmailIcon || isTaxIcon || isCalendarIcon || isStreamlineplumpIcon;

  return (
    <Icon
      icon={found.icon}
      style={{
        color,
        fontSize: size,
        verticalAlign: needsSpecialAlignment ? 'baseline' : 'middle',
        display: 'inline-block',
        lineHeight: 1,
        marginTop: needsSpecialAlignment ? '-1px' : '0',
        marginRight: needsSpecialAlignment && !collapsed ? '8px' : '0',
        transform: needsSpecialAlignment ? 'translateY(1px)' : 'none'
      }}
    />
  );
};