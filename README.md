# **DataPilot — Image Annotation Platform**

DataPilot is a performance-focused image annotation tool built for medium-to-large datasets. It supports fast navigation through **10,000+ images**, autosave for bounding-box annotations, dataset-level overviews, and bulk image ingestion via Supabase Edge Functions.

**Live demo:**  
👉 https://dataset-explorer-kappa.vercel.app/

---

## 🚀 **Features**

### 🔎 **Fast Dataset Browsing**
- Scroll and paginate through **10k images** smoothly  
- Client-side thumbnail caching for quick revisit  
- Instant dataset switching via searchable dataset selector  

### 🖊️ **Bounding Box Annotation**
- Create, move, resize, and delete bounding boxes  
- Autosave after each edit (typically **<150 ms**)  
- Stable under rapid edits or tab switching  
- Fully recoverable on refresh with Supabase persistence  

### 📁 **Bulk Dataset Uploads**
- Upload a ZIP of images via a Supabase Edge Function  
- Extracts and registers images server-side  
- Designed and tested for datasets up to **10,000 images**  
- Includes filename normalization and safe handling  

### 📊 **Dataset Insights**
- Shows image counts per dataset  
- Thumbnail previews  
- Quick-jump navigation for faster labeling  

### 🌐 **Network Awareness**
- Built-in network indicator  
- Detects online/offline state reliably  
- Auto-fades when connectivity is restored  
- Prevents annotation loss during outages  

### 🎨 **Modern UI/UX**
- Built with **Next.js (App Router)**, **React**, **TypeScript**, **Tailwind**, and **shadcn/ui**  
- Workspace-style layout optimized for desktop annotation  
- Mobile-friendly browsing (**annotation disabled on mobile**)  

---

## 🏗️ **Tech Stack**

### **Frontend**
- Next.js (App Router)  
- React  
- TypeScript  
- TailwindCSS + shadcn/ui  

### **Backend**
- Supabase Database  
- Supabase Storage  
- Supabase Edge Functions  
- Postgres RPC queries for fast analytics  

### **Deployment**
- **Vercel** for frontend  
- **Supabase** for auth, storage, and backend logic  

---

## ⚙️ **Dataset Upload Flow**

1. Upload a ZIP through the UI  
2. A Supabase Edge Function processes the archive:
   - Extracts files  
   - Normalizes names  
   - Uploads images to Storage  
   - Inserts rows into Postgres  
3. The UI refreshes dataset listings automatically  
4. Thumbnails appear and become ready for annotation  

**Max tested dataset:**  
🟢 **10,000 images**

---

## 📝 **Annotation Flow**

1. Select a dataset  
2. Navigate to an image  
3. Draw bounding boxes using mouse controls  
4. Autosave triggers instantly after edits  
5. Offline edits are paused to avoid data loss  
6. Refreshing the page restores all annotations from Supabase  

---

## 🛠️ **Development Notes**

This project focuses on:

- High performance with large datasets  
- Reliable autosave with low backend overhead  
- Clear, maintainable full-stack architecture  
- Informative visualizations for dataset-scale annotation work  

---

## 🌟 **Future Improvements**

- Polygon / segmentation annotation tools  
- Multi-user collaboration  
- Export to YOLO format  
- Image-level metadata panel  
- Keyboard shortcuts for power users  
