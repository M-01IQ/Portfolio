import React from 'react';

const PublicBtn = ({ 
  checked, 
  onChange, 
  label, 
  onText = "", 
  offText = "", 
  disabled = false,
  className = "" 
}) => {
  
  // دالة للتعامل مع التغيير لتجنب الأخطاء إذا لم يتم تمرير onChange
  const handleChange = (e) => {
    if (disabled) return;
    if (onChange) {
      onChange(e.target.checked);
    }
  };

  return (
    <label className={`flex items-center id:5.14 select-none cursor-pointer gap-3 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}>
      {/* النص الجانبي للمكون (إن وجد) */}
      {label && <span className="text-gray-700 font-medium text-sm">{label}</span>}
      
      <div className="relative">
        {/* Input الخفي المسؤول عن الحالة */}
        <input
          type="checkbox"
          className="sr-only peer"
          checked={checked}
          onChange={handleChange}
          disabled={disabled}
        />
        
        {/* خلفية الـ Toggle */}
        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 transition-colors duration-200">
          
          {/* نصوص داخلية اختيارية (مثل ON/OFF) تظهر حسب الحالة */}
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white transition-opacity duration-200 ${checked ? 'opacity-100' : 'opacity-0'}`}>
            {onText}
          </span>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500 transition-opacity duration-200 ${checked ? 'opacity-0' : 'opacity-100'}`}>
            {offText}
          </span>
        </div>
      </div>
    </label>
  );
};

export default PublicBtn;
