# Beforest Vector Search

A Next.js application for searching images in Dropbox using semantic vector search. The application provides both text-based and image-based search capabilities with a beautiful, brand-consistent user interface.

## Features

- Semantic vector search for images
- Image-based similarity search
- Real-time search results with pagination
- Image preview with metadata
- Download functionality
- Redis caching for improved performance
- Responsive design
- Beforest brand styling

## Tech Stack

- Next.js 14
- TypeScript
- Tailwind CSS
- Redis
- Dropbox SDK
- Headless UI

## Setup

1. Clone the repository:
```bash
git clone https://github.com/harshaislive/beforest_vector_search.git
cd beforest_vector_search
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```env
# Dropbox Configuration
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret
DROPBOX_REFRESH_TOKEN=your_refresh_token

# Redis Configuration
REDIS_URL=your_redis_url

# Vector Search API
VECTOR_SEARCH_API_URL=https://weaviatefilesearch-production.up.railway.app/search/text

# App Configuration
NEXT_PUBLIC_MAX_RESULTS=144
NEXT_PUBLIC_RESULTS_PER_PAGE=12
```

4. Run the development server:
```bash
npm run dev
```

## Usage

1. **Text Search**: Enter keywords in the search bar to find relevant images
2. **Image Search**: Click "Search by Image" to upload an image and find similar images
3. **Preview**: Click on any image to view it in full size with metadata
4. **Download**: Use the download button in the preview modal to save images

## Development

- `src/app`: Next.js app router pages
- `src/components`: React components
- `src/lib`: Utility functions and API clients
- `public`: Static assets

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
