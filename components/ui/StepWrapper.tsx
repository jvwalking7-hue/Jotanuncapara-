import { Separator } from '@/components/ui/separator';
export function StepWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className='px-8 w-full space-y-6'>
      {children}
    </div>
  );
}
