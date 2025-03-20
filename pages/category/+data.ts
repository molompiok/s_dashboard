
export { data }
export type Data = Awaited<ReturnType<typeof data>>

import fetch from 'node-fetch'
import type { PageContextServer } from 'vike/types'
import { CategoryInterface, ListType } from '../../Interfaces/Interfaces'
import { Api_host } from '../../renderer/+config'

const data = async (pageContext: PageContextServer) => {
  await sleep(300) // Simulate slow network
  console.log(pageContext.urlParsed.search['store'], pageContext.urlParsed.search['id']);
  let categories: ListType<CategoryInterface> | undefined = undefined;
const id = pageContext.urlParsed.search['id'];
  try {
    if ( id!== 'new') {
      const response = await fetch(`${Api_host}/get_categories/?category_id=${id}`)//&store_name=${pageContext.urlParsed.search['store']}
      categories = (await response.json()) as ListType<CategoryInterface>
    }
  } catch (error) {
    console.error(error);
  }
  const category = categories?.list[0]
  // We remove data we don't need because the data is passed to the client; we should
  // minimize what is sent over the network.
  //   category = minimize(category);

  return {
    category,
    // The page's <title>
    title: category?.name,
    description: category?.description,
    logoUrl: category?.view?.[0] || category?.icon?.[0]
  }
}

// function minimize(category: CategoryInterface & Record<string, unknown>): CategoryInterface {
//   const { id, title, release_date, director, producer } = category
//   category = { id, title, release_date, director, producer }
//   return category
// }

function sleep(milliseconds: number) {
  return new Promise((r) => setTimeout(r, milliseconds))
}
