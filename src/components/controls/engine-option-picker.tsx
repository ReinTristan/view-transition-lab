import { ControlSelect } from '@/components/controls/control-select'
import {
  useEngineId,
  useEngineOption,
  useThemeStore,
} from '@/themes/use-theme-store'
import { engineMeta } from '@/transitions'

/**
 * An axis that belongs to one engine — tailwind's five sub-engines today.
 *
 * It reads EngineMeta.options and renders nothing when the engine declares
 * none. Deliberately not `if (engine === 'tailwind')`: that would be a second
 * place that knows about specific engines, and the day GSAP wants to choose
 * between Flip and a tween the bar would have to learn about it too.
 */
export function EngineOptionPicker() {
  const id = useEngineId()
  const engine = engineMeta(id)
  const value = useEngineOption(id)
  const setEngineOption = useThemeStore((state) => state.setEngineOption)

  if (!engine.options || value === null) return null

  return (
    <ControlSelect
      id={`engine-option-${engine.options.id}`}
      label={engine.options.label}
      value={value}
      choices={engine.options.choices.map((choice) => ({
        id: choice.id,
        label: choice.label,
        blurb: choice.blurb,
        ready: choice.status === 'ready',
      }))}
      onChange={(choice) => setEngineOption(id, choice)}
    />
  )
}
