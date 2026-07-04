'use client';

interface DeleteButtonProps {
  postId: number;
  className?: string;
  children?: React.ReactNode;
  redirectTo?: string;
}

export default function DeleteButton({ 
  postId, 
  className, 
  children, 
  redirectTo,
  ...buttonProps 
}: DeleteButtonProps & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!confirm('Delete this post?')) {
      e.preventDefault();
    }
  };

  return (
    <form action={`/api/admin/posts/${postId}/delete`} method="POST" className="inline">
      {redirectTo && (
        <input type="hidden" name="redirectTo" value={redirectTo} />
      )}
      <button 
        type="submit" 
        className={className || "btn btn-secondary text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"}
        onClick={handleClick}
        {...buttonProps}
      >
        {children || 'Delete'}
      </button>
    </form>
  );
}
