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
import previousItems from '@src/thames-and-hudson/previousItems'

// Create an RSS feed
function createFeed(items: BookItem[]) {
  const feed = new RSS({
    title: feedDetails.thamesAndHudson.title,
    description: feedDetails.thamesAndHudson.description,
    feed_url: '',
    site_url: '',
    language: 'en'
  })

  items.forEach(item => {
    feed.item({
      title: item.title,
      description: `<p>${item.description}</p><br /><strong>Price: ${item.price}</strong>`,
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
    const { data } = await axios.get(feedDetails.thamesAndHudson.url)
    const $ = cheerio.load(data)

    const items: BookItem[] = $('.product-item-info').map((index, element) => {
      const $element = $(element)
      const href = $element.find('.product-item-photo').attr('href') || ''
      const title = $element.find('.product-item-name').text()
      const author = $element.find('.block').text()
      const price = $element.find('.price-box').text()
      const image = ($element.find('source').attr('data-srcset') || '').replace('?format=webp', '')
      return {
        href,
        title: stripWhiteSpace(title),
        description: stripWhiteSpace(author),
        price: stripWhiteSpace(price),
        image
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

const filePath = path.join(dir, 'thamesAndHudson.xml')

// Save RSS feed to an XML file
scrapeData().then(data => {
  console.log('data', data)
  const xml = createFeed(data) // Generate the XML from the scraped data
  fs.writeFileSync(filePath, xml, 'utf8') // Write the XML to a file
  console.log('RSS feed saved to feed.xml')
})
