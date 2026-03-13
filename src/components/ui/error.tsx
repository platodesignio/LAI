"use client";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorDisplay({
  title = "Something went wrong",
  message,
  retry,
}: ErrorDisplayProps) {
  return (
    <div className="border border-red-200 bg-red-50 p-4">
      <p className="text-xs font-medium uppercase tracking-widest text-red-600 mb-1">
        {title}
      </p>
      <p className="text-sm text-red-700">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-3 text-xs underline text-red-600 hover:text-red-800"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function FormError({ message }: { message: string }) {
  return (
    <div className="border border-red-200 bg-red-50 px-3 py-2">
      <p className="text-sm text-red-700">{message}</p>
    </div>
  );
}

export function FormSuccess({ message }: { message: string }) {
  return (
    <div className="border border-green-200 bg-green-50 px-3 py-2">
      <p className="text-sm text-green-700">{message}</p>
    </div>
  );
}
