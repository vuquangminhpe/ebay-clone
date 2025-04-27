import { CheckCircle } from 'lucide-react'

export function Steps({ children }: { children: React.ReactNode }) {
  return <div className='flex flex-col space-y-2'>{children}</div>
}

export function Step({
  title,
  description,
  active,
  completed
}: {
  title: string
  description?: string
  active?: boolean
  completed?: boolean
}) {
  return (
    <div className='flex items-center gap-2'>
      <div
        className={`rounded-full p-2 ${completed ? 'bg-green-100 text-green-700' : active ? 'bg-blue-100 text-blue-700' : 'bg-gray-100'}`}
      >
        {completed ? <CheckCircle className='h-4 w-4' /> : <div className='h-4 w-4' />}
      </div>
      <div>
        <div className='font-medium'>{title}</div>
        {description && <div className='text-sm text-muted-foreground'>{description}</div>}
      </div>
    </div>
  )
}
