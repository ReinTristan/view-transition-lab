import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { setEngine, useEngineId } from '@/themes/use-theme'
import type { EngineId } from '@/transitions'
import { engineList } from '@/transitions'

export function EnginePicker() {
  const active = useEngineId()

  return (
    <div className='flex items-center gap-2'>
      <Label htmlFor='engine' className='text-muted-foreground text-xs'>
        Engine
      </Label>
      <Select
        value={active}
        onValueChange={(value) => setEngine(value as EngineId)}
      >
        <SelectTrigger id='engine' size='sm' className='w-40'>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {engineList.map((engine) => (
            <SelectItem
              key={engine.id}
              value={engine.id}
              disabled={!engine.ready}
            >
              {engine.label}
              {!engine.ready && ' · pending'}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
