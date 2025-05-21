import React, { createContext, useContext } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useFormContext } from "react-hook-form";

type Option = {
  id: string;
  label: string;
};

type CheckboxGroupProps = {
  name: string;
  options: Option[];
  className?: string;
};

export const CheckboxGroup = ({ name, options, className }: CheckboxGroupProps) => {
  const form = useFormContext();
  
  if (!form) {
    throw new Error("CheckboxGroup must be used within a FormProvider");
  }
  
  return (
    <div className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ${className}`}>
      {options.map((option) => (
        <FormField
          key={option.id}
          control={form.control}
          name={name}
          render={({ field }) => {
            const values = field.value || [];
            return (
              <FormItem className="flex items-start space-x-2 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={values.includes(option.id)}
                    onCheckedChange={(checked) => {
                      const currentValues = field.value || [];
                      return checked
                        ? field.onChange([...currentValues, option.id])
                        : field.onChange(
                            currentValues.filter((value: string) => value !== option.id)
                          );
                    }}
                  />
                </FormControl>
                <FormLabel className="font-normal cursor-pointer">
                  {option.label}
                </FormLabel>
              </FormItem>
            );
          }}
        />
      ))}
    </div>
  );
};
