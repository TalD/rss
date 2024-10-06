import axios from 'axios'
import * as cheerio from 'cheerio'
import RSS from 'rss'
import fs from 'fs'
import path from 'path'
import { difference } from 'ramda'
// Local
import {
  type BookItem,
  feedDetails,
  bucketName,
  stripWhiteSpace
} from '@src/utils'
import previousItems from '@src/phaidon/previousItems'

// Create an RSS feed
function createFeed(items: BookItem[]) {
  const feed = new RSS({
    title: feedDetails.phaidon.title,
    description: feedDetails.phaidon.description,
    feed_url: '',
    site_url: '',
    language: 'en'
  })

  items.forEach(item => {
    feed.item({
      title: item.title,
      description: `Price: ${item.price}`,
      url: item.href, // Modify as necessary
      date: new Date(),
      enclosure: {
        url: item.image,
        type: "image/jpeg"
      }, // Image enclosure
    })
  })

  return feed.xml()
}

async function scrapeData() {
  try {
    const { data } = await axios.get(`${feedDetails.phaidon.url}/store`)
    const $ = cheerio.load(data)

    const items: BookItem[] = $('.product-sortable').map((index, element) => {
      const $element = $(element)
      const href = $element.attr('href') || ''
      const title = $element.find('.h3').text()
      const author = ''
      const price = $element.find('.price.usd').text()
      const image = ($element
        .find('source')
        .attr('srcset') || '')
        .split(',')[1]
        .replace(' 2x', '')
        .replace(/webp/g, 'jpg')
        .trim()
      return {
        href: `${feedDetails.phaidon.url}${href}`,
        title: stripWhiteSpace(title),
        price: stripWhiteSpace(price).replace('Price ', '').replace('USD', ''),
        image: `${feedDetails.phaidon.url}${image}`
      }
    }).get()
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
// const dir = path.join(__dirname, 'dist')
const dir = 'dist'

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir)
}

const filePath = path.join(dir, 'phaidon.xml')

// Save RSS feed to an XML file
scrapeData().then(data => {
  console.log('data', data)
  const xml = createFeed(data) // Generate the XML from the scraped data
  fs.writeFileSync(filePath, xml, 'utf8') // Write the XML to a file
  console.log('RSS feed saved to feed.xml')
})
