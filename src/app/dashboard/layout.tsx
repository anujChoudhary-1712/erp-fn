import CustomersLayout from "@/components/CustomersLayout";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <CustomersLayout>{children}</CustomersLayout>;
};

export default layout;
