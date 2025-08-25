import { targetMarkdown, normalizeNewlines } from '@microsoft/chartifact-compiler';
import { InteractiveDocument } from '@microsoft/chartifact-schema';
import fs from 'node:fs';

function convertToMarkdown(interactiveDocument: InteractiveDocument): string {
    // Convert the Interactive Document to Markdown format
    let markdown = targetMarkdown(interactiveDocument);

    if (!interactiveDocument.style) {
        //remove any line that starts with the group identifier ":::"
        markdown = markdown
            .split('\n')
            .filter(line => !line.startsWith(':::'))
            .join('\n');
    }

    return normalizeNewlines(markdown, 2).trim();
}

async function convertJsonFiles(sourceDir: string, destDir: string, jsonCopyBase: string) {
    const files = fs.readdirSync(sourceDir, { withFileTypes: true });

    for (const file of files) {
        const sourcePath = `${sourceDir}/${file.name}`;
        const destPath = `${destDir}/${file.name.replace(/\.json$/, '.md')}`;

        // Path for copying json file
        const jsonCopyPath = `${jsonCopyBase}/${sourcePath.replace(/^\.\/json\//, '')}`;

        if (file.isDirectory()) {
            // Create the destination directory if it doesn't exist
            if (!fs.existsSync(destPath)) {
                fs.mkdirSync(destPath, { recursive: true });
                console.log(`Created directory: ${destPath}`);
            }
            // Create the json copy directory if it doesn't exist
            const jsonCopyDir = `${jsonCopyBase}/${file.name}`;
            if (!fs.existsSync(jsonCopyDir)) {
                fs.mkdirSync(jsonCopyDir, { recursive: true });
                console.log(`Created directory: ${jsonCopyDir}`);
            }
            // Recursively convert files in the subdirectory
            await convertJsonFiles(sourcePath, destPath, jsonCopyBase);
        } else if (file.isFile() && file.name.endsWith('.json')) {
            console.log(`Converting: ${sourcePath} -> ${destPath}`);
            // Read the JSON file
            const jsonContent = fs.readFileSync(sourcePath, 'utf-8');
            const interactiveDocument: InteractiveDocument = JSON.parse(jsonContent);

            // Convert to Markdown
            const markdownContent = convertToMarkdown(interactiveDocument);

            // Write the Markdown file
            fs.writeFileSync(destPath, markdownContent);
            console.log(`Written: ${destPath}`);

            // Copy the JSON file with $schema set to prod
            // Ensure the destination directory exists
            const jsonCopyDir = jsonCopyPath.substring(0, jsonCopyPath.lastIndexOf('/'));
            if (!fs.existsSync(jsonCopyDir)) {
                fs.mkdirSync(jsonCopyDir, { recursive: true });
            }
            // Set $schema to prod and write the modified JSON
            const jsonCopyObj = { ...interactiveDocument, $schema: "https://microsoft.github.io/chartifact/schema/idoc_v1.json" };
            fs.writeFileSync(jsonCopyPath, JSON.stringify(jsonCopyObj, null, 2));
            console.log(`Copied JSON: ${sourcePath} -> ${jsonCopyPath}`);
        }
    }
}

// Main call with explicit json copy destination
convertJsonFiles('./json', '../../docs/assets/examples/markdown', '../../docs/assets/examples/json');
