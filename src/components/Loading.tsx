"use client";
import { Loader } from "lucide-react";

const Loading = ({ message }: { message: string }) => {
  return (
    <div className="text-center">
      <p>Loading {message}...</p>
      <Loader className="animate-spin h-6 w-6 mx-auto" />
    </div>
  );
};

export default Loading;
