import z from 'zod'
import path from 'path'
import fs from 'fs'

export const stripWhiteSpace = (x: string): string => x.replace(/\n+/g, '').trim()

export const bucketName = 'tal-danan'

const zFeedDetailsSchema = z.object({
  fileName: z.string(),
  url: z.string().url(),
  title: z.string(),
  description: z.string()
})

const zFeedSourcesSchema = z.record(zFeedDetailsSchema)

type FeedDetailsSchema = z.infer<typeof zFeedSourcesSchema>

const zBookItem = z.object({
  href: z.string().url(),
  title: z.string(),
  description: z.string().optional(),
  price: z.string().optional(),
  image: z.string().url()
})

export type BookItem = z.infer<typeof zBookItem>

export const feedDetails: FeedDetailsSchema = {
  zapposBrooks: {
    fileName: 'zappos-brooks.xml',
    url: 'https://www.zappos.com',
    title: 'Zappos | Brooks',
    description: 'Brooks Men\'s New Arrivals'
  },
  brooks: {
    fileName: 'brooks.xml',
    url: 'https://www.brooksrunning.com',
    title: 'Brooks',
    description: 'Brooks Men\'s Running Shoes'
  },
  thamesAndHudson: {
    fileName: 'thames-and-hudson.xml',
    url: 'https://thamesandhudson.com/books',
    title: 'Thames & Hudson Books',
    description: 'Thames & Hudson Latest Books'
  },
  monacelli: {
    fileName: 'monacelli.xml',
    url: 'https://www.phaidon.com',
    title: 'Monacelli Books',
    description: 'Monacelli Latest Books'
  },
  phaidon: {
    fileName: 'phaidon.xml',
    url: 'https://www.phaidon.com',
    title: 'Phaidon Books',
    description: 'Phaidon Latest Books'
  },
  taschen: {
    fileName: 'taschen.xml',
    url: 'https://www.taschen.com',
    title: 'Taschen Books',
    description: 'Taschen Latest Books'
  },
  nike: {
    fileName: 'nike.xml',
    url: 'https://nike.com',
    title: 'NIKE Mens Shoes',
    description: 'Latest NIKE Mens Shoes'
  }
} as const

export const getFilePath = (x: string) => {
  // Ensure the dist directory exists, if not, create it
  const dir = 'dist'
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
  }
  const filePath = path.join(dir, x)
  return filePath
}