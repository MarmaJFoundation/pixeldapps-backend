/* This example requires Tailwind CSS v2.0+ */
const posts = [
  {
    title: "Pixel-Party",
    href: "https://pixelparty.pixeldapps.co",
    category: { name: "NFT Art", href: "https://pixelparty.pixeldapps.co" },
    description:
      "Pixelparty is pixelboard with 600 frames, each with the size of 20x20px. Additionally each frameholder earns pixeltoken once per week.",
    state: "Online",
    datetime: "2020-03-16",
    imageUrl: "./party.jpg",
    readingTime: "6 min",
  },
  {
    title: "Pixel-Battle",
    href: "#",
    category: { name: "Art Contest", href: "#" },
    description:
      "Show your pixelart skills in a contest with other artists. The community will vote their favourites and decides who deserves the prizepool.",
    state: "Online",
    datetime: "2020-03-10",
    imageUrl: "./draw.jpg",
    readingTime: "4 min",
  },
  {
    title: "Pixel-Creatures",
    href: "#",
    category: { name: "NFT Gaming", href: "#" },
    description:
      "Hatch, train, evolve, trade and fight with a large selection of different and unique pets.",
    state: "WIP",
    datetime: "2020-02-12",
    imageUrl: "./fight.jpg",
    readingTime: "11 min",
  },
];

export default function Example() {
  return (
    <div className="relative px-4 pt-8 pb-2 sm:px-6 lg:pt-14 lg:pb-4 lg:px-8">
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <h1 className="md:text-5xl font-extrabold tracking-tight text-gray-100 sm:text-4xl">
            We make blockchain-based dapps!
          </h1>
        </div>
        <div className="grid max-w-lg gap-5 mx-auto mt-12 lg:grid-cols-3 lg:max-w-none">
          {posts.map((post) => (
            <div
              key={post.title}
              className="flex flex-col overflow-hidden rounded-lg shadow-lg"
            >
              <div className="flex-shrink-0">
                <div className="relative inline-block">
                  <div className="reveal">
                    <div className="reveal-container">
                      <div className="reveal__title-overlay">
                        <div className="reveal__title-overlay-text">
                          {post.state}
                        </div>
                      </div>
                    </div>
                    <a href={post.category.href}>
                      <img
                        src={post.imageUrl}
                        className="object-cover -mb-2"
                        alt="Alt goes here!"
                      />
                    </a>
                  </div>
                </div>
              </div>
              <div className="flex flex-col justify-between flex-1 p-6 bg-white">
                <div className="flex-1">
                  <p className="text-sm font-medium text-indigo-600">
                    {post.category.name}
                  </p>
                  <a href={post.href} className="block mt-2">
                    <p className="text-2xl font-semibold text-gray-900">
                      {post.title}
                    </p>
                    <p className="mt-3 text-base text-gray-500">
                      {post.description}
                    </p>
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
