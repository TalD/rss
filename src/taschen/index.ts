import axios from 'axios'
import * as cheerio from 'cheerio'
import RSS from 'rss'
import fs from 'fs'
import path from 'path'
import { difference } from 'ramda'
// Local
import {
  feedDetails,
  bucketName,
  stripWhiteSpace,
  type BookItem
} from '@src/utils'
import previousItems from '@src/taschen/previousItems'

// Create an RSS feed
function createFeed(items: BookItem[]) {
  const feed = new RSS({
    title: feedDetails.taschen.title,
    description: feedDetails.taschen.description,
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
    const { data } = await axios.get(`${feedDetails.taschen.url}/en/books/all-titles`)
    const $ = cheerio.load(data)

    const items: BookItem[] = $('.product-tile').map((index, element) => {
      const $element = $(element)
      const href = $element.find('a').attr('href')
      const title = $element.find('h3 a').text()
      const author = ''
      const price = $element.find('.formatted-price').text()
      const image = ($element
        .find('source')
        .attr('srcset') || '')
        .split(',')[1]
        .replace(' 1x', '')
        .trim()
      return {
        href: `${feedDetails.taschen.url}${href}`,
        title: stripWhiteSpace(title),
        description: stripWhiteSpace(author),
        price: `$${stripWhiteSpace(price)}`,
        image: `https://taschen.makaira.media/taschen/image/upload/f_webp,${image}`
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

const filePath = path.join(dir, 'taschen.xml')

// Save RSS feed to an XML file
scrapeData().then(data => {
  console.log('data', data)
  const xml = createFeed(data) // Generate the XML from the scraped data
  fs.writeFileSync(filePath, xml, 'utf8') // Write the XML to a file
  console.log('RSS feed saved to feed.xml')
})
