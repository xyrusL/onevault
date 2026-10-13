-- 0008_update_demo_notes_tiptap_format.sql
-- Update starter demo notes to use Tiptap semantic rich-text and task lists

UPDATE notes
SET content = '<h3>Study Topics & Checklist</h3><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Review Chapters 1-4 summaries</p></div></li><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked="checked"><span></span></label><div><p>Practice problem set #3</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Memorize core definitions & theorem formulas</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Prepare revision flashcards</p></div></li></ul><p><br></p><p><em>Important: Exam starts at 10:30 AM in Room 302. Bring scientific calculator and student ID.</em></p>'
WHERE id = 'note_mid_test';

UPDATE notes
SET content = '<p><strong>Director:</strong> Christopher Nolan</p><p><strong>Genre:</strong> Sci-Fi / Thriller</p><p><strong>Rating:</strong> 9.5/10</p><p><br></p><p>Key Themes:</p><ul><li>Lucid dreaming architecture</li><li>Subconscious projections</li><li>Totems as reality checks</li></ul><p><br></p><blockquote><p>"An idea is like a virus. Resilient. Highly contagious."</p></blockquote>'
WHERE id = 'note_movie_weekend';

UPDATE notes
SET content = '<h1>Cloudflare Infrastructure Specs</h1><ul><li>D1 Database bindings: <strong>onevault-storage</strong></li><li>Email routing rules: mapped to Worker</li><li>API latency: &lt; 45ms global edge</li></ul><p><br></p><pre><code># Deploy updates
npm run cf:deploy</code></pre><p><br></p><p>Next steps: verify SPF/DKIM records and token encryption.</p>'
WHERE id = 'note_jonas_notes';
