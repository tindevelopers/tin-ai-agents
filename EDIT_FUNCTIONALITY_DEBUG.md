
# Edit Functionality Debug Guide

## How Edit Function Should Work

1. **In My Posts Tab**: Click the Edit button (pencil icon) on any blog post
2. **System saves** post data to localStorage with key `editPostData`
3. **Toast notification** appears: "Post loaded for editing! Switch to Content Editor tab"
4. **Switch to Content Editor tab**
5. **Content Editor loads** the post data automatically
6. **Orange banner appears** showing "Editing existing post: [Post Title]"
7. **Form fields populate** with the post data
8. **Edit and save** your changes

## Debug Steps

### Step 1: Check Browser Console
Open browser developer tools (F12) and check the Console tab for these messages:
- `📝 Saving edit data to localStorage:` (when clicking Edit)
- `🚀 Content Editor mounted, checking for saved data...` (when switching tabs)
- `✅ Found edit post data in localStorage:` (when data is found)
- `📖 Loading edit post data:` (when loading the data)

### Step 2: Check localStorage
In browser console, run: `localStorage.getItem('editPostData')`
You should see the JSON data of the post you're trying to edit.

### Step 3: Check Edit Banner
After switching to Content Editor, you should see an orange banner at the top saying:
"Editing existing post: [Post Title]"

### Step 4: Clear Edit Data
If something goes wrong, click the "Clear" button in the orange banner to reset.

## Common Issues & Solutions

### Issue: "Edit function not working"
**Possible Causes:**
1. Not switching to Content Editor tab after clicking Edit
2. Browser localStorage is disabled
3. JavaScript errors preventing the code from running
4. Page refresh clearing localStorage data

**Solutions:**
1. **Must click Edit button then switch to Content Editor tab**
2. Check browser settings for localStorage permissions
3. Check browser console for JavaScript errors
4. Don't refresh the page after clicking Edit

### Issue: Form fields not populating
**Causes:**
- Data in localStorage might be corrupted
- JavaScript error during data loading

**Solutions:**
- Clear localStorage: `localStorage.removeItem('editPostData')`
- Try clicking Edit button again
- Check browser console for error messages

### Issue: Can't tell if edit mode is active
**Solution:**
Look for the orange "Editing existing post" banner at the top of Content Editor.

## Troubleshooting Commands

Run these in browser console if needed:

```javascript
// Check what's in localStorage
console.log('Edit data:', localStorage.getItem('editPostData'));

// Clear edit data manually
localStorage.removeItem('editPostData');

// Check if Content Editor is listening for events
console.log('Event listeners:', window);
```
