const fs = require('fs');

const replacements = {
  'src/app/auth/verify/page.tsx': [
    { line: 143, from: `Didn't`, to: `Didn&apos;t` }
  ],
  'src/app/dashboard/client/Booking.tsx': [
    { line: 496, from: `haven't`, to: `haven&apos;t` },
    { line: 769, from: `"{bookingToCancel.mountainName}"`, to: `&quot;{bookingToCancel.mountainName}&quot;` }
  ],
  'src/app/dashboard/client/Dashboard.tsx': [
    { line: 253, from: `"{bookingToCancel.mountainName}"`, to: `&quot;{bookingToCancel.mountainName}&quot;` }
  ],
  'src/app/dashboard/client/ProfileSettings.tsx': [
    { line: 670, from: `Didn't`, to: `Didn&apos;t` }
  ],
  'src/app/not-found.tsx': [
    { line: 30, from: `doesn't`, to: `doesn&apos;t` },
    { line: 30, from: `Let's`, to: `Let&apos;s` }
  ],
  'src/app/page.tsx': [
    { line: 640, from: `"Bound by the spirits of the mountains, guide with heritage."`, to: `&quot;Bound by the spirits of the mountains, guide with heritage.&quot;` },
    { line: 780, from: `"{featuredPhoto.testimonial.text}"`, to: `&quot;{featuredPhoto.testimonial.text}&quot;` },
    { line: 820, from: `"{expandedPhoto.testimonial.text}"`, to: `&quot;{expandedPhoto.testimonial.text}&quot;` },
    { line: 861, from: `"{testimonial.text}"`, to: `&quot;{testimonial.text}&quot;` }
  ],
  'src/app/schedule/page.tsx': [
    { line: 240, from: `Don't`, to: `Don&apos;t` },
    { line: 377, from: `We'll`, to: `We&apos;ll` }
  ],
  'src/components/admin/sections/BookingManagement.tsx': [
    { line: 411, from: `"{j.notes}"`, to: `&quot;{j.notes}&quot;` }
  ],
  'src/components/admin/sections/TestimonialsManagement.tsx': [
    { line: 336, from: `"{testimonial.testimonial_text}"`, to: `&quot;{testimonial.testimonial_text}&quot;` },
    { line: 371, from: `haven't`, to: `haven&apos;t` },
    { line: 455, from: `Hiker's`, to: `Hiker&apos;s` },
    { line: 575, from: `Hiker's`, to: `Hiker&apos;s` }
  ],
  'src/components/booking/steps/MountainSelection.tsx': [
    { line: 216, from: `What's`, to: `What&apos;s` }
  ],
  'src/components/layout/Header.tsx': [
    { line: 329, from: `You'll`, to: `You&apos;ll` }
  ]
};

for (const [file, changes] of Object.entries(replacements)) {
  const content = fs.readFileSync(file, 'utf8').split('\n');
  for (const change of changes) {
    const idx = change.line - 1;
    content[idx] = content[idx].replace(change.from, change.to);
  }
  fs.writeFileSync(file, content.join('\n'));
}
console.log('Done!');
