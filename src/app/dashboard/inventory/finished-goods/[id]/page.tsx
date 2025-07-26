"use client";
import GoodsApis from "@/actions/Apis/GoodsApis";
import React, { useEffect } from "react";

const SingleGoodPage = ({ params }: { params: { id: string } }) => {
  const fetchFinishedGood = async () => {
    try {
      const res = await GoodsApis.getSingleGood(params.id);
      if (res.status === 200) {
        console.log("Finished Good Data:", res.data);
      }
    } catch (error) {
      console.error("Error fetching finished good:", error);
    }
  };

  useEffect(() => {
    fetchFinishedGood();
  }, [params.id]);
  return <div>page</div>;
};

export default SingleGoodPage;
