import { z } from 'zod'
import { BOOK_PARTS, SEASONS } from './derive'

export const KINDS = ['era', 'planet', 'character', 'faction', 'event', 'artifact', 'difference'] as const
export type Kind = (typeof KINDS)[number]

const Id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'id: только kebab-case')
const Hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'цвет: #rrggbb')
const Url = z.string().regex(/^https?:\/\//, 'источник: URL')
const Vec3 = z.tuple([z.number(), z.number(), z.number()])

export const TextSchema = z.object({ ru: z.string().min(1), en: z.string().min(1).optional() })
export type Text = z.infer<typeof TextSchema>

const View = z.object({ position: Vec3, target: Vec3 })

const AppearsIn = z.object({
  show: z
    .array(z.object({ season: z.number().int().min(1).max(SEASONS + 1), episodes: z.array(z.number().int().min(1)).optional() }))
    .optional(),
  book: z.array(z.enum(BOOK_PARTS)).optional(),
})

const TimelineEntry = z.object({
  era: Id,
  note: TextSchema,
  status: z.enum(['alive', 'dead', 'digital', 'cryo', 'destroyed', 'absent']).optional(),
  planet: Id.optional(),
  faction: Id.optional(),
})

export const BookBlock = z.object({
  presence: z.enum(['same', 'different', 'show-only', 'book-only']),
  diff: TextSchema.optional(),
  name: TextSchema.optional(),
  originalName: z.string().optional(),
  counterpart: Id.optional(),
})

const Related = z.object({ id: Id, role: TextSchema })

const common = {
  id: Id,
  name: TextSchema,
  originalName: z.string().optional(),
  summary: TextSchema,
  body: TextSchema.optional(),
  appearsIn: AppearsIn.default({}),
  timeline: z.array(TimelineEntry).optional(),
  related: z.array(Related).default([]),
  sources: z.array(Url).default([]),
}
const withEras = { ...common, eras: z.array(Id).min(1), book: BookBlock }

export const EraSchema = z.object({
  ...common,
  kind: z.literal('era'),
  order: z.number().int().min(1),
  years: z.object({
    start: z.number().int(),
    end: z.number().int(),
    bookStart: z.number().int().optional(),
    bookEnd: z.number().int().optional(),
    label: TextSchema,
  }),
  palette: z.object({ primary: Hex, glow: Hex }),
  view: View.optional(),
})

export const PlanetSchema = z.object({
  ...withEras,
  kind: z.literal('planet'),
  galaxy: z.object({ arm: z.number().int().min(0), r: z.number().min(0).max(1), offset: z.number(), y: z.number().optional() }),
  look: z.object({
    type: z.enum(['city', 'ocean', 'desert', 'ice', 'gas', 'barren']),
    colorA: Hex,
    colorB: Hex,
    radius: z.number().positive(),
  }),
  view: View.optional(),
})

export const CharacterSchema = z.object({
  ...withEras,
  kind: z.literal('character'),
  faction: Id.optional(),
  homeworld: Id.optional(),
  actor: z.string().optional(),
})

export const FactionSchema = z.object({ ...withEras, kind: z.literal('faction'), color: Hex })

export const EventSchema = z.object({
  ...withEras,
  kind: z.literal('event'),
  year: z.number().int().optional(),
  yearBook: z.number().int().optional(),
  yearLabel: TextSchema.optional(),
  planet: Id.optional(),
  isSeldonCrisis: z.boolean().optional(),
})

export const ArtifactSchema = z.object({ ...withEras, kind: z.literal('artifact'), planet: Id.optional() })
export const DifferenceSchema = z.object({ ...withEras, kind: z.literal('difference') })

export const EntitySchema = z.discriminatedUnion('kind', [
  EraSchema, PlanetSchema, CharacterSchema, FactionSchema, EventSchema, ArtifactSchema, DifferenceSchema,
])

export type Era = z.infer<typeof EraSchema>
export type Planet = z.infer<typeof PlanetSchema>
export type Character = z.infer<typeof CharacterSchema>
export type Faction = z.infer<typeof FactionSchema>
export type Event = z.infer<typeof EventSchema>
export type Artifact = z.infer<typeof ArtifactSchema>
export type Difference = z.infer<typeof DifferenceSchema>
export type Entity = z.infer<typeof EntitySchema>
export type NonEra = Exclude<Entity, Era>

// Что добавляет build-data
const EraOutSchema = EraSchema.extend({ t: z.number().min(0).max(1) })
const PlanetOutSchema = PlanetSchema.extend({ xyz: Vec3 })
const EntityOutSchema = z.discriminatedUnion('kind', [
  EraOutSchema, PlanetOutSchema, CharacterSchema, FactionSchema, EventSchema, ArtifactSchema, DifferenceSchema,
])
export const DatasetSchema = z.object({ version: z.literal(1), entities: z.array(EntityOutSchema) })

export type EraOut = z.infer<typeof EraOutSchema>
export type PlanetOut = z.infer<typeof PlanetOutSchema>
export type EntityOut = z.infer<typeof EntityOutSchema>
export type NonEraOut = Exclude<EntityOut, EraOut>
export type Dataset = z.infer<typeof DatasetSchema>
