# email-filter

Parse and format gmail-like email filter queries

This module parses gmail-style filter queries into an ast-style object, 
and formats such objects back to a filter-string

## Installation

    npm install email-filter
    
## Usage

```javascript
    const filter = require("email-filter");
    
    const filterObject = filter.parse("to:foo@example.com");
    
    const filterString = filter.format([
        {
            key: "to",
            value: "foo@example.com"
        }
    ]);
```

## Example

Gmail lets you search your emails using a simple query language, for example consider the following string:

    after:03/19/1979 before:01/21/2032 attachment:true biz baz -{foo bar} from:sender@domain.com smaller:1M subject:(hello world) to:mail@example.com

This would transform into an object like:

```javascript
    [
        {
            key: "match",
            reject: "foo bar",
            accept: "biz baz"
        },
        {
            key: "to",
            value: "mail@example.com"
        },
        {
            key: "from",
            value: "sender@domain.com"
        },
        {
            key: "subject",
            value: "hello world"
        },
        {
            key: "date",
            before: "01/21/2032",
            after: "03/19/1979",
        },
        {
            key: "has",
            attachment: true
        },
        {
            key: "size",
            predicate: "smaller",
            size: "1M"
        }
    ]
```

### Work in progress
    
Currently email-parse does not _parse_ AND and OR queries into an AST:

```javascript
    // and style query
    filter.parse("to:{mom,dad}");
    // [ { key: 'to', value: 'mom,dad' } ]

    
    // or style query
    filter.parse("to:{mom|dad}");
    // [ { key: 'to', value: 'mom|dad' } ]
```
