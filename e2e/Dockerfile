FROM mcr.microsoft.com/playwright:v1.58.2-jammy

WORKDIR /e2e

# Copy package files and install deps at build time
# (node_modules may also be populated via bind mount at runtime)
COPY package.json ./
RUN npm install

# Copy test files and config
COPY . .

# Ensure results directories exist (created at build time; volume mount may override at runtime)
RUN mkdir -p /results/report /results/test-results

# Default: run all tests (reporters and output dirs come from playwright.config.ts)
CMD ["sh", "-c", "npm install && mkdir -p /results/report /results/test-results && npx playwright test"]
