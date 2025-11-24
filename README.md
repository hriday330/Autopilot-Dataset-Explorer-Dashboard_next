# DataPilot — Image Annotation Platform

DataPilot is a performance-focused image annotation tool built for medium-to-large datasets. It supports fast navigation through 10,000+ images, autosave for bounding-box annotations, dataset-level overviews, and bulk image ingestion via Supabase Edge Functions.

Live demo:
👉 https://dataset-explorer-kappa.vercel.app/

## 🚀 Features
###🔎 Fast Dataset Browsing

Scroll and paginate through 10k images smoothly

Client-side thumbnail caching for quick revisit

Instant dataset switching via searchable dataset selector

###🖊️ Bounding Box Annotation

Create, move, resize, and delete bounding boxes

Autosave after each edit (typically <150 ms)

Works even under rapid editing or tab switching

Recoverable after refresh thanks to Supabase persistence

###📁 Bulk Dataset Uploads

Upload a ZIP of images via a Supabase Edge Function

Extracts and registers images server-side

Designed for up to 10,000 images (tested)

Includes filename normalization and safe handling

###📊 Dataset Insights

Count totals per dataset

Preview thumbnails

Quick-jump to target images for labeling

###🌐 Network Awareness

Built-in network indicator

Detects online/offline state reliably

Auto-fades when connectivity is restored

Prevents annotation loss during outages

###🎨 Modern UI/UX

Built with Next.js App Router, React, TypeScript, Tailwind, and shadcn/ui

Clean, workspace-style layout optimized for desktop annotation

Mobile-friendly browsing (annotation disabled on mobile)

##🏗️ Tech Stack
Frontend

Next.js (App Router)

React

TypeScript

TailwindCSS + shadcn/ui

Backend

Supabase Database

Supabase Storage

Supabase Edge Functions

Postgres RPC queries for fast analytics

Deployment

Vercel for frontend

Supabase for auth, storage, and backend logic

##⚙️ Dataset Upload Flow

Upload a ZIP through the UI

A Supabase Edge Function processes the ZIP:

Extracts files

Normalizes names

Uploads to Storage

Inserts rows into Postgres

The UI automatically refreshes the dataset selector

Images appear with thumbnails ready for annotation

Max tested dataset:
🟢 10,000 images

##📝 Annotation Flow

Open a dataset & navigate to an image

Draw bounding boxes with mouse

Edits autosave immediately

Offline changes are prevented while offline indicator is visible

Refreshing the page restores annotations from Supabase

##🛠️ Development Notes

This project focuses on:

Performance under large datasets

Reliable autosave with minimal backend load

A clean annotation UX and informative visualizations for large scale datasets

Clear, maintainable full-stack architecture

### 🌟 Future Improvements

Polygon/segmentation tools

Multi-user collaboration

Export to YOLO format

Image-level metadata support

Keyboard shortcuts for professional workflows
