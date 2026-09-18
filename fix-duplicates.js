const fs = require('fs');
const path = require('path');
const pages = ['index.html', 'what-is-hinglish/index.html', 'faq/index.html', 'privacy-policy/index.html', 'terms/index.html'];

pages.forEach(page => {
    const fullPath = path.join('D:/projects/opencode/Hinglish', page);
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Count nav-actions occurrences
    const navActionsRegex = /<div class="nav-actions">/g;
    const matches = content.match(navActionsRegex);
    const count = matches ? matches.length : 0;
    
    console.log(page + ': ' + count + ' nav-actions sections');
    
    if (count > 1) {
        // Find all positions of <div class="nav-actions">
        const positions = [];
        let match;
        const regex = /<div class="nav-actions">/g;
        while ((match = regex.exec(content)) !== null) {
            positions.push(match.index);
        }
        
        // Keep first, remove others
        if (positions.length > 1) {
            // Find the content structure:
            // First nav: from positions[0] to its closing </div>
            // Second nav: from positions[1] to its closing </div>
            // Third nav (if exists): from positions[2] to its closing </div>
            
            let firstSectionEnd;
            let secondSectionEnd;
            let thirdSectionEnd;
            
            // Find first closing </div>
            firstSectionEnd = content.indexOf('</div>', positions[0]) + 6;
            
            // Find second closing </div>
            secondSectionEnd = content.indexOf('</div>', positions[1]) + 6;
            
            // Find third closing </div> (if exists)
            if (positions.length > 2) {
                thirdSectionEnd = content.indexOf('</div>', positions[2]) + 6;
            }
            
            // Rebuild content
            let newContent;
            if (positions.length > 2) {
                // Three sections: keep first, remove second and third
                newContent = content.substring(0, firstSectionEnd) + content.substring(thirdSectionEnd);
                console.log('  -> Removed 2 duplicates (3→1)');
            } else {
                // Two sections: keep first, remove second
                newContent = content.substring(0, firstSectionEnd) + content.substring(secondSectionEnd);
                console.log('  -> Removed 1 duplicate (2→1)');
            }
            
            fs.writeFileSync(fullPath, newContent, 'utf8');
        }
    }
});
console.log('Done fixing all pages');