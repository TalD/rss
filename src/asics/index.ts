import axios from 'axios'
import * as cheerio from 'cheerio'
import RSS from 'rss'
import fs from 'fs'
import path from 'path'
import { difference } from 'ramda'
import puppeteer from 'puppeteer'
// Local
import {
  feedDetails,
  bucketName,
  stripWhiteSpace,
  type BookItem,
  getFilePath
} from '@src/utils'
import previousItems from '@src/asics/previousItems'

// Create an RSS feed
function createFeed(items: BookItem[]) {
  const feed = new RSS({
    title: feedDetails.zapposBrooks.title,
    description: feedDetails.zapposBrooks.description,
    feed_url: '',
    site_url: '',
    language: 'en'
  })

  items.forEach((item) => {
    feed.item({
      title: item.title,
      description: `<p>${item.description}</p><br /><strong>Price: ${item.price}</strong>`,
      url: item.href, // Modify as necessary
      date: new Date(),
      enclosure: {
        url: item.image,
        type: 'image/jpeg',
      }, // Image enclosure
    })
  })

  return feed.xml()
}

async function scrapeData() {
  try {
    const browser = await puppeteer.launch({
      headless: true
    })
    const page = await browser.newPage()

    // Navigate to the target URL
    await page.goto(`${feedDetails.zapposBrooks.url}/filters/mens-shoes-brooks/WgEa4gIBCw.zso?t=mens%20shoes`, {
      waitUntil: 'networkidle0', // Ensures that the page has fully loaded
    })

    // Scrape data from the fully rendered page
    const items: BookItem[] = await page.evaluate(() => {
      const products = Array.from(document.querySelectorAll('article'))
      return products.map((product) => {
        const href = product.querySelector('a')?.getAttribute('href') || ''

        const title = product.querySelector('.Ql-z span')?.textContent || ''
        const description = ''
        const price = product.querySelector('.dia-z')?.textContent || ''
        const image = product.querySelector('source')?.getAttribute('srcset') || ''

        return {
          href: `${feedDetails.zapposBrooks.url}String(href)`,
          title: title.trim(),
          description,
          price,
          image: image.split(' ')[0],
        }
      })
    })

    await browser.close()

    const updatedFeedInfo = difference(items, previousItems) as BookItem[]

    const dir = path.join(__dirname)
    const filePath = path.join(dir, 'previousItems.ts')

    fs.writeFileSync(
      filePath,
      `export default ${JSON.stringify(updatedFeedInfo)}`,
      'utf8'
    )

    return updatedFeedInfo
  } catch (error) {
    console.error('Error fetching data:', error)
    return []
  }
}

// Ensure the dist directory exists, if not, create it
const dir = 'dist'

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

const filePath = path.join(dir, 'zapposBrooks.xml')

// Save RSS feed to an XML file
scrapeData().then((data) => {
  console.log('data', data)
  const xml = createFeed(data) // Generate the XML from the scraped data
  fs.writeFileSync(filePath, xml, 'utf8') // Write the XML to a file
  console.log('RSS feed saved to feed.xml')
})
