import { request } from 'graphql-request'
import useSWR from 'swr'

const QUERY = `{
    bar(id: "0x98Ff640323C059d8C4CB846976973FEEB0E068aA") {
      ratio
    }
}`

const fetcher = (query) => request('https://thegraph.tangoswap.cash/subgraphs/name/tangoswap/bar', query)

// Returns ratio of XSushi:Sushi
export default function useSushiPerXSushi(parse = true) {
  const { data } = useSWR(QUERY, fetcher)
  return parse ? parseFloat(data?.bar?.ratio) : data?.bar?.ratio
}
