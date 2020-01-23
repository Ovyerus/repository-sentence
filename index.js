const { GraphQLClient } = require("graphql-request");
const { token } = require("./token.json");

const client = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    Authorization: `bearer ${token}`
  }
});

const query = `query searchRepos($query: String!) {
  search(type: REPOSITORY, query: $query, first: 100) {
    edges {
      node {
        ... on Repository {
          name,
          url
        }
      }
    }
  }
}`;

(async () => {
  const words = process.argv.slice(2).map(x =>
    x
      .replace(/\s/g, " ")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .toLowerCase()
  );
  let urls = [];

  if (!words.length) return console.error("Gimme a setence.");

  for (const word of words)
    urls.push(
      (async () => {
        const {
          search: { edges }
        } = await client.request(query, { query: `${word} in:name` });

        return edges
          .map(edge => edge.node)
          .find(node => node.name.toLowerCase() === word);
      })()
    );

  urls = await Promise.all(urls);
  console.log(urls.map(x => x && x.url).join("\n"));
})()
  .then(() => process.exit(0))
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
