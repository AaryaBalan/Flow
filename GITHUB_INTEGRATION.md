# GitHub Integration Setup Guide

This guide explains how to set up and use the GitHub integration feature in your DevCollab application.

## Features

-  ✅ Repository details (description, stars, forks, language, last updated)
-  ✅ Complete directory structure with expandable tree view
-  ✅ Code file viewer with syntax highlighting
-  ✅ Repository statistics and metrics
-  ✅ Language distribution
-  ✅ Automatic caching (1-hour TTL)
-  ✅ Clean, organized UI

## Backend Setup

### 1. Environment Variables

For higher API rate limits (recommended), add your GitHub Personal Access Token to `.env`:

```env
GITHUB_TOKEN=ghp_your_personal_access_token_here
```

**To create a GitHub Personal Access Token:**

1. Go to GitHub Settings → Developer Settings → Personal Access Tokens → Tokens (classic)
2. Click "Generate new token"
3. Give it a descriptive name (e.g., "DevCollab Integration")
4. Select scopes: `public_repo` (for public repositories)
5. Click "Generate token" and copy it immediately
6. Add it to your `.env` file

**Rate Limits:**

-  Without token: 60 requests/hour per IP
-  With token: 5,000 requests/hour

### 2. Dependencies

The following packages are already installed:

-  `axios` - HTTP client for API requests
-  `node-cache` - In-memory caching layer

### 3. Database Migration

The GitHub columns have been added to your Projects table:

-  `githubRepoUrl` - Full GitHub repository URL
-  `githubOwner` - Repository owner username
-  `githubRepo` - Repository name

## Frontend Setup

### Dependencies

The following packages are already installed:

-  `react-syntax-highlighter` - Code syntax highlighting
-  `axios` - HTTP client

## How to Use

### 1. Link a GitHub Repository to a Project

1. Navigate to any project
2. Click on the "GitHub" tab in the project navigation
3. Click the "Settings" button
4. Enter the full GitHub repository URL (e.g., `https://github.com/facebook/react`)
5. Click "Save"

### 2. View Repository Information

Once linked, you can:

**Files Tab:**

-  Browse the complete directory structure
-  Click on folders to expand/collapse them
-  Click on files to view their contents with syntax highlighting
-  Supports 20+ programming languages

**About Tab:**

-  View repository statistics (stars, forks, watchers, issues)
-  See default branch and license information
-  Check creation and last push dates
-  View language distribution

## API Endpoints

### Get Repository Details

```
GET /api/github/repo/:owner/:repo
```

### Get Repository Tree Structure

```
GET /api/github/repo/:owner/:repo/tree?branch=main
```

### Get File Contents

```
GET /api/github/repo/:owner/:repo/file?path=src/index.js&branch=main
```

### Get Repository Languages

```
GET /api/github/repo/:owner/:repo/languages
```

### Get Repository README

```
GET /api/github/repo/:owner/:repo/readme
```

### Clear Cache (Admin)

```
POST /api/github/cache/clear
```

## Caching Strategy

-  **TTL**: 1 hour (3600 seconds)
-  **Storage**: In-memory using node-cache
-  **Benefits**:
   -  Reduces GitHub API calls
   -  Improves response time
   -  Prevents rate limit issues
-  **Cache Keys Format**:
   -  Repository: `repo_{owner}_{repo}`
   -  Tree: `tree_{owner}_{repo}_{branch}`
   -  File: `file_{owner}_{repo}_{branch}_{path}`
   -  Languages: `languages_{owner}_{repo}`
   -  README: `readme_{owner}_{repo}`

## Supported File Types for Syntax Highlighting

JavaScript, TypeScript, Python, Java, C++, C, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, HTML, CSS, SCSS, JSON, XML, YAML, Markdown, SQL, Bash, and more.

## Error Handling

The integration handles:

-  ❌ Invalid GitHub URLs
-  ❌ Repository not found (404)
-  ❌ API rate limit exceeded (403)
-  ❌ Network errors
-  ❌ Large files (with size warnings)

## Performance Considerations

1. **Tree Truncation**: GitHub API may truncate large repositories (>1000 files). In such cases, a warning is shown.
2. **File Size Limits**: Very large files may take longer to load. Consider file size warnings in the UI.
3. **Caching**: Reduces API calls significantly. Clear cache only when necessary.

## Troubleshooting

### Rate Limit Exceeded

**Solution**: Add a GitHub Personal Access Token to your `.env` file.

### Repository Not Found

**Possible causes**:

-  Invalid repository URL
-  Private repository (requires authentication)
-  Repository deleted or renamed

**Solution**: Verify the URL is correct and the repository is public.

### Cache Issues

If you see stale data, clear the cache:

```bash
curl -X POST http://localhost:3000/api/github/cache/clear
```

## Future Enhancements

Potential improvements:

-  [ ] Search within files
-  [ ] Commit history view
-  [ ] Pull request integration
-  [ ] Issue tracking
-  [ ] Branch switching
-  [ ] Download files
-  [ ] Code search
-  [ ] Blame view
-  [ ] Diff viewer

## Security Notes

1. **GitHub Token**: Keep your token secret. Never commit it to version control.
2. **Public Repositories**: This integration works best with public repositories.
3. **Private Repositories**: Requires authentication token with appropriate scopes.

## Credits

-  GitHub REST API v3
-  react-syntax-highlighter
-  node-cache
-  Lucide Icons

---

**Need Help?** Check the console for detailed error messages or contact your development team.
