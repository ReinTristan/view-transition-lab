import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className='space-y-3'>
      <h2 className='font-heading font-semibold text-sm'>{title}</h2>
      {children}
    </section>
  )
}

/**
 * Visual reference shared by every route. Being identical everywhere, any
 * difference you see comes from the theme and nothing else.
 *
 * Deliberately small and free of any reference to this project: what gives a
 * theme away is radius, border, shadow and typeface, and a row of buttons plus
 * a card show all four. The full component gallery belongs in /lab.
 */
export function Showcase() {
  return (
    <div className='space-y-10'>
      <Section title='Actions'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button>Primary</Button>
          <Button variant='secondary'>Secondary</Button>
          <Button variant='outline'>Outline</Button>
          <Button variant='ghost'>Ghost</Button>
          <Button size='sm'>Small</Button>
          <Button size='xs'>Tiny</Button>
        </div>
        <div className='flex flex-wrap items-center gap-2'>
          <Badge>Badge</Badge>
          <Badge variant='secondary'>Secondary</Badge>
          <Badge variant='outline'>Outline</Badge>
          <Avatar>
            <AvatarFallback>VT</AvatarFallback>
          </Avatar>
        </div>
      </Section>

      <Section title='Surface'>
        <Card className='max-w-md'>
          <CardHeader>
            <CardTitle>A card is a surface</CardTitle>
            <CardDescription>
              Background, border, shadow and rounding, all at once.
            </CardDescription>
          </CardHeader>
          <CardContent className='text-muted-foreground text-sm'>
            Every theme paints this same card. Watch the corners and the edge:
            that is where two themes stop looking alike.
          </CardContent>
        </Card>
      </Section>
    </div>
  )
}
