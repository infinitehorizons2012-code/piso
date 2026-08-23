const fs = require('fs');

const pianoHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/Piano/hoc_piano_abc.html', 'utf8');
const drumHtml = fs.readFileSync('C:/Users/DT.HANG/Downloads/Drum/hoc_danh_trong.html', 'utf8');

// Extract container contents
function extractContainer(html) {
    const match = html.match(/<div class="container">([\s\S]*?)<\/div>\s*<script>/);
    if (match) {
        return match[1];
    }
    return html;
}

let pianoContent = extractContainer(pianoHtml);
let drumContent = extractContainer(drumHtml);

// Escape < and > inside <pre> tags completely
function escapePreTags(content) {
    return content.replace(/<pre([\s\S]*?)>([\s\S]*?)<\/pre>/g, (match, attrs, code) => {
        const escapedCode = code
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        return `<pre${attrs} style="background: #f0f9ff; color: #0f172a; border: 2px solid #bae6fd; border-radius: 12px; padding: 15px; font-family: monospace; font-size: 0.95rem; overflow-x: auto;">${escapedCode}</pre>`;
    });
}

pianoContent = escapePreTags(pianoContent);
drumContent = escapePreTags(drumContent);

// Fix class names in demo blocks
pianoContent = pianoContent
    .replace(/class="abc-demo"/g, 'class="theory-abc-demo"')
    .replace(/class="abc-source"/g, 'class="theory-abc-source"')
    .replace(/class="abc-paper"/g, 'class="theory-abc-paper"')
    .replace(/class="abc-audio"/g, 'class="theory-abc-audio"');

drumContent = drumContent
    .replace(/class="abc-demo"/g, 'class="theory-abc-demo"')
    .replace(/class="abc-source"/g, 'class="theory-abc-source"')
    .replace(/class="abc-paper"/g, 'class="theory-abc-paper"')
    .replace(/class="abc-audio"/g, 'class="theory-abc-audio"');

const modalHtml = `
    <!-- THEORY MODAL -->
    <div id="theory-modal" class="modal-overlay" style="display: none;">
      <div class="theory-modal-container" style="border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.2);">
        <div class="modal-header" style="background: linear-gradient(135deg, #ff6b6b, #ff8e53); color: white; padding: 18px 25px; display: flex; justify-content: space-between; align-items: center; border-radius: 20px 20px 0 0;">
          <div style="display: flex; align-items: center; gap: 20px;">
            <h3 style="margin: 0; font-size: 1.4rem; color: white; display: flex; align-items: center; gap: 8px; font-weight: 800;">📚 Thư Viện Lý Thuyết ABC Notation</h3>
            <div class="theory-tab-nav" style="display: flex; gap: 10px;">
              <button id="theory-tab-piano" onclick="window.switchTheoryTab('piano')" class="theory-tab-btn active" style="padding: 8px 16px; border-radius: 20px; border: none; font-weight: bold; cursor: pointer; background: white; color: #ff6b6b; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">🎹 Lý Thuyết Piano</button>
              <button id="theory-tab-drum" onclick="window.switchTheoryTab('drum')" class="theory-tab-btn" style="padding: 8px 16px; border-radius: 20px; border: none; font-weight: bold; cursor: pointer; background: rgba(255,255,255,0.25); color: white;">🥁 Lý Thuyết Trống</button>
            </div>
          </div>
          <button onclick="window.closeTheoryModal()" style="background: white; border: none; color: #ff6b6b; font-size: 1rem; cursor: pointer; padding: 6px 14px; border-radius: 20px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.1);">✕ Đóng</button>
        </div>
        
        <div class="modal-body" style="padding: 30px; overflow-y: auto; max-height: 80vh; background: #ffffff;">
          <div id="theory-content-piano" class="theory-tab-content">
            ${pianoContent}
          </div>
          <div id="theory-content-drum" class="theory-tab-content" style="display: none;">
            ${drumContent}
          </div>
        </div>
      </div>
    </div>
`;

fs.writeFileSync('C:/Users/DT.HANG/Downloads/piano solo/scratch/theory_modal.html', modalHtml);
console.log('Successfully generated kid-friendly bright theory_modal.html!');
