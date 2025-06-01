import InternalLayout from "@/components/InternalLayout";
import React from "react";

const layout = ({ children }: { children: React.ReactNode }) => {
  return <InternalLayout>{children}</InternalLayout>;
};

export default layout;
