{{#sprites}}.flag-{{name}} { background: url('{{../baseUrl}}{{../fileName}}') no-repeat -{{x}}px -{{y}}px; width: {{width}}px; height: {{height}}px; }
{{/sprites}}

p.flag {
    width: 20px;
    height: 20px;
    position: absolute;
    left: 0;
    bottom: 6px;
}