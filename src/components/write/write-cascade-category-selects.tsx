"use client";

import { ChevronDown } from "lucide-react";
import {
  CASCADE_MID_PLACEHOLDER,
  CASCADE_SUB_PLACEHOLDER,
  WRITE_CASCADE_CATEGORIES,
  type CascadeMainCategory,
  getMidOptions,
  getSubOptions,
} from "@/lib/write-cascade-categories";

const selectClass =
  "w-full appearance-none bg-transparent text-sm text-gray-700 focus-ring disabled:cursor-not-allowed disabled:text-gray-300";

type WriteCascadeCategorySelectsProps = {
  mainCategory: CascadeMainCategory | "";
  midCategory: string;
  subCategory: string;
  onMainChange: (main: CascadeMainCategory | "") => void;
  onMidChange: (mid: string) => void;
  onSubChange: (sub: string) => void;
  /** 섹션 고정 시 대분류 선택 숨김 */
  hideMain?: boolean;
  mainLabel?: string;
};

function SelectField({
  id,
  value,
  onChange,
  disabled,
  required,
  placeholder,
  options,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required && !disabled}
        className={selectClass}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown
        className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
    </div>
  );
}

export function WriteCascadeCategorySelects({
  mainCategory,
  midCategory,
  subCategory,
  onMainChange,
  onMidChange,
  onSubChange,
  hideMain = false,
  mainLabel = "대분류",
}: WriteCascadeCategorySelectsProps) {
  const midOptions = getMidOptions(mainCategory);
  const subOptions = getSubOptions(mainCategory, midCategory);
  const showMid = Boolean(mainCategory);
  const showSub = Boolean(mainCategory && midCategory);
  const midPlaceholder = mainCategory
    ? CASCADE_MID_PLACEHOLDER[mainCategory]
    : "중분류";
  const subPlaceholder = mainCategory
    ? CASCADE_SUB_PLACEHOLDER[mainCategory]
    : "소분류";

  return (
    <div className="space-y-0 border-b border-border-light py-3 px-4">
      {!hideMain && (
        <div className="relative">
          <label htmlFor="cascade-main" className="sr-only">
            {mainLabel}
          </label>
          <select
            id="cascade-main"
            name="cascadeMain"
            value={mainCategory}
            onChange={(e) => {
              onMainChange(e.target.value as CascadeMainCategory | "");
            }}
            required
            className={selectClass}
          >
            <option value="" disabled>
              {mainLabel}를 선택하세요
            </option>
            {(Object.keys(WRITE_CASCADE_CATEGORIES) as CascadeMainCategory[]).map(
              (main) => (
                <option key={main} value={main}>
                  {main}
                </option>
              )
            )}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        </div>
      )}

      {showMid && (
        <div className="grid grid-cols-2 gap-2 mt-2">
          <SelectField
            id="cascade-mid"
            value={midCategory}
            onChange={onMidChange}
            required
            placeholder={midPlaceholder}
            options={midOptions}
          />
          {showSub ? (
            <SelectField
              id="cascade-sub"
              value={subCategory}
              onChange={onSubChange}
              required
              placeholder={subPlaceholder}
              options={subOptions}
            />
          ) : (
            <select
              id="cascade-sub-placeholder"
              name="cascadeSubPlaceholder"
              disabled
              className={selectClass}
              aria-hidden
              tabIndex={-1}
            >
              <option value="">{subPlaceholder}</option>
            </select>
          )}
        </div>
      )}
    </div>
  );
}
