import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function TypographyShowcase() {
  return (
    <div className="space-y-8">
      {/* Display Typography */}
      <Card>
        <CardHeader>
          <CardTitle className="text-display">Display Typography</CardTitle>
          <CardDescription>Large, attention-grabbing text for hero sections</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-display">The quick brown fox</div>
          <div className="text-headline">jumps over the lazy dog</div>
          <p className="text-muted-foreground">
            Display and headline styles use optimized letter spacing and font weights
          </p>
        </CardContent>
      </Card>

      {/* Heading Hierarchy */}
      <Card>
        <CardHeader>
          <CardTitle>Heading Hierarchy</CardTitle>
          <CardDescription>Semantic heading structure with proper scaling</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h1>Heading 1 - Main Page Title</h1>
            <p className="text-sm text-muted-foreground">text-4xl, font-semibold, tracking-tight</p>
          </div>
          <div>
            <h2>Heading 2 - Section Title</h2>
            <p className="text-sm text-muted-foreground">text-3xl, font-semibold, tracking-tight</p>
          </div>
          <div>
            <h3>Heading 3 - Subsection</h3>
            <p className="text-sm text-muted-foreground">text-2xl, font-semibold, tracking-tight</p>
          </div>
          <div>
            <h4>Heading 4 - Component Title</h4>
            <p className="text-sm text-muted-foreground">text-xl, font-semibold, tracking-tight</p>
          </div>
          <div>
            <h5>Heading 5 - Card Title</h5>
            <p className="text-sm text-muted-foreground">text-lg, font-semibold</p>
          </div>
          <div>
            <h6>Heading 6 - Small Title</h6>
            <p className="text-sm text-muted-foreground">text-base, font-medium</p>
          </div>
        </CardContent>
      </Card>

      {/* Body Text */}
      <Card>
        <CardHeader>
          <CardTitle>Body Text & Paragraphs</CardTitle>
          <CardDescription>Optimized for readability with proper line height</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose">
            <p>
              This is regular body text using the Inter font family. It's designed for optimal 
              readability with a comfortable line height and letter spacing. The text uses 
              font feature settings for improved ligatures and character variants.
            </p>
            <p>
              <strong>Bold text</strong> stands out clearly, while <em>italic text</em> provides 
              subtle emphasis. You can also use <code>inline code</code> for technical terms 
              or short snippets.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Utility Classes */}
      <Card>
        <CardHeader>
          <CardTitle>Typography Utilities</CardTitle>
          <CardDescription>Pre-built classes for common text patterns</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="text-title">Title Text</div>
            <p className="text-sm text-muted-foreground">text-title class</p>
          </div>
          
          <div className="space-y-2">
            <div className="text-body">Body text with optimal reading settings</div>
            <p className="text-sm text-muted-foreground">text-body class</p>
          </div>
          
          <div className="space-y-2">
            <div className="text-caption">Caption or helper text</div>
            <p className="text-sm text-muted-foreground">text-caption class</p>
          </div>
          
          <div className="space-y-2">
            <div className="text-overline">OVERLINE TEXT</div>
            <p className="text-sm text-muted-foreground">text-overline class</p>
          </div>
        </CardContent>
      </Card>

      {/* Code Typography */}
      <Card>
        <CardHeader>
          <CardTitle>Code Typography</CardTitle>
          <CardDescription>Monospace fonts optimized for code readability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p>Inline code: <code>const greeting = "Hello, World!"</code></p>
          </div>
          
          <div>
            <p className="text-sm text-muted-foreground mb-2">Code block:</p>
            <pre><code>{`function calculateTotal(items) {
  return items.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);
}`}</code></pre>
          </div>
        </CardContent>
      </Card>

      {/* Font Weights & Sizes */}
      <Card>
        <CardHeader>
          <CardTitle>Font Weights & Sizes</CardTitle>
          <CardDescription>Complete range of weights and sizes available</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Font Weights</h4>
              <div className="space-y-2">
                <div className="font-light">Light (300)</div>
                <div className="font-normal">Normal (400)</div>
                <div className="font-medium">Medium (500)</div>
                <div className="font-semibold">Semibold (600)</div>
                <div className="font-bold">Bold (700)</div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Font Sizes</h4>
              <div className="space-y-2">
                <div className="text-xs">Extra Small (12px)</div>
                <div className="text-sm">Small (14px)</div>
                <div className="text-base">Base (16px)</div>
                <div className="text-lg">Large (18px)</div>
                <div className="text-xl">Extra Large (20px)</div>
                <div className="text-2xl">2XL (24px)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Elements */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Text Elements</CardTitle>
          <CardDescription>Links, badges, and other interactive typography</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p>
              Here's a paragraph with a <a href="#" className="text-primary hover:underline">
              standard link
              </a> that follows our typography guidelines.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Badge variant="default">Default Badge</Badge>
            <Badge variant="secondary">Secondary Badge</Badge>
            <Badge variant="outline">Outline Badge</Badge>
          </div>
          
          <div className="space-y-2">
            <blockquote className="border-l-4 border-border pl-4 italic text-muted-foreground">
              "Typography is the craft of endowing human language with a durable visual form."
              <footer className="text-sm mt-2 not-italic">— Robert Bringhurst</footer>
            </blockquote>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}