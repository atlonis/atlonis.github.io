export function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="status">
      <p>{message}</p>
      <button type="button" onClick={onRetry}>Повторить</button>
    </div>
  )
}
