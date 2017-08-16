const test = require("tape");
const filter = require("./index");

test("it should parse a simple filter string", (assert) => {
    const input = "to:mail@example.com";
    const result = filter.parse(input);

    assert.deepEqual(result, [{ key: "to", value: "mail@example.com" }]);
    assert.end();
});

test("it should parse two filters", (assert) => {
    const input = "to:mail@example.com from:sender@example.com";
    const result = filter.parse(input);

    assert.deepEqual(result, [{ key: "to", value: "mail@example.com" }, { key: "from", value: "sender@example.com" }]);
    assert.end();
});

test("it should parse two filters and a word", (assert) => {
    const input = "to:mail@example.com from:sender@example.com foo";
    const result = filter.parse(input);

    assert.deepEqual(result, [
        { key: "to", value: "mail@example.com" },
        { key: "from", value: "sender@example.com" },
        { key: "match", accept: "foo" }
    ]);

    assert.end();
});

test("it should parse grouping words", (assert) => {
    const input = "(foo bar baz)";
    const result = filter.parse(input);

    assert.deepEqual(result, [{ accept: "foo bar baz", key: "match" }]);

    assert.end();
});

test("it should parse reject match", (assert) => {
    const input = "-(foo bar baz)";
    const result = filter.parse(input);

    assert.deepEqual(result, [{ reject: "foo bar baz", key: "match" }]);

    assert.end();
});

test("it should parse a complext search", assert => {
    const input = "to:example subject:(foo bar baz) -biz has:attachment smaller:1M after:2016/8/10 before:2018/8/11";
    const result = filter.parse(input);

    const expect = [{ key: "to", value: "example" },
        { key: "subject", value: "foo bar baz" },
        { key: "match", reject: "biz" },
        { key: "has", attachment: true },
        { key: "size", value: "1M", predicate: "smaller" },
        {
            value: { after: "2016/8/10", before: "2018/8/11" },
            key: "date"
        }
    ];

    assert.deepEqual(result, expect);
    assert.end();
});

test("should parse broken search", assert => {
    const cases = [{
            value: "to:matthijs test -Last day) ",
            expect: [
                { key: "to", value: "matthijs" },
                { key: "match", accept: "test day", reject: "Last" }
            ]
        },
        {
            value: "to:matthijs test -(Last day) ",
            expect: [{ key: "to", value: "matthijs" },
                { key: "match", accept: "test", reject: "Last day" }
            ]
        },
        {
            value: "to:matthijs test -{Last day}",
            expect: [{ key: "to", value: "matthijs" },
                { key: "match", accept: "test", reject: "Last day" }
            ]
        },
        {
            value: "to:matthijs test -(Last day) -(Startups)    ",
            expect: [{ key: "to", value: "matthijs" },
                { key: "match", accept: "test", reject: "Last day Startups" }
            ]
        },
    ];


    cases.forEach(testCase => {
        const result = filter.parse(testCase.value);
        assert.deepEqual(result, testCase.expect);
    });


    assert.end();
});


test("should format a simple search", assert => {
    const input = [{
        key: "to",
        value: "mail@example.com"
    }];

    const output = filter.format(input);

    assert.equal(output, "to:mail@example.com");
    assert.end();
});

test("should format a search", assert => {
    const input = [{
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
        }
    ];

    const output = filter.format(input);
    assert.equal(output, "from:sender@domain.com subject:(hello world) to:mail@example.com");
    assert.end();
});

test("should format free-text search", assert => {
    const input = [{
        key: "match",
        accept: "foo bar baz"
    }];

    const output = filter.format(input);

    assert.equal(output, "foo bar baz");
    assert.end();
});

test("should format free-text reject search", assert => {
    const input = [{
        key: "match",
        reject: "foo bar baz"
    }];

    const output = filter.format(input);
    assert.equal(output, "-{foo bar baz}");
    assert.end();
});

test("should format date", assert => {
    const input = [{
        key: "date",
        before: "21/01/2032",
        after: "19/03/1979",
    }];

    const output = filter.format(input);

    assert.equal(output, "after:19/03/1979 before:21/01/2032");
    assert.end();
});

test("format size", assert => {
    const input = [{
        key: "size",
        predicate: "smaller",
        size: "1M"
    }];

    const output = filter.format(input);

    assert.equal(output, "smaller:1M");
    assert.end();
});

test("format attachment", assert => {
    const input = [{
        key: "has",
        attachment: true
    }, ];

    const output = filter.format(input);

    assert.equal(output, "attachment:true");
    assert.end();
});

test("format a kitchen sink", assert => {
    const input = [{
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
    ];

    const output = filter.format(input);
    const expect = "after:03/19/1979 before:01/21/2032 attachment:true biz baz -{foo bar} \
from:sender@domain.com smaller:1M subject:(hello world) to:mail@example.com";

    assert.equal(output, expect);
    assert.end();

});