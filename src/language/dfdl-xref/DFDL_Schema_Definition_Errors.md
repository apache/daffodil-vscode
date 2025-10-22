**_Schema Definition Error_** or **_SDE_** for short - these indicate
the DFDL schema is not meaningful. They are generally fatal errors that
prevent or stop processing of data.

5.3.2      **MinLength, MaxLength**

These facets are used:

- When dfdl:lengthKind is \"implicit\" and type is xs:string or
  xs:hexBinary. In that case the length is given by the value of the XSD
  maxLength facet. In this case the XSD minLength facet is required to
  be equal to the XSD maxLength facet (Schema Definition Error
  otherwise).

- For validation of variable length string elements.

  6.3.4      **Enumerations in DFDL**

Some DFDL properties accept an enumerated list of valid values. It is a
Schema Definition Error if a value other than one of the enumerated
values is specified. The case of the specified value must match the
enumeration. An enumeration is of type string unless otherwise stated.

7.1.1      **Property Binding Syntax**

A _property binding_ is the syntax in a DFDL schema that gives a value
to a property. Up to this point, the examples in this document have all
used a specific syntax for property bindings called _attribute form_.
However, the format properties may be specified in any one of three
forms:

1.  Attribute form

2.  Element form

3.  Short form

A DFDL property may be specified using any of the forms with the
following exceptions:

- The dfdl:ref property may be specified in attribute or short form

- The dfdl:escapeSchemeRef property may be specified in attribute or
  short form

- The dfdl:hiddenGroupRef  property may be specified in attribute or
  short form

- The dfdl:prefixLengthType property may be specified in attribute or
  short form

- Short form must not be used on the xs:schema element.

It is a Schema Definition Error if the same property is specified in
more than one form. That is, there is no priority ordering where one
form takes precedent over another.

7.1.2      **Empty String as a Representation Property Value**

DFDL provides no mechanism to un-set a property. Setting a
representation property\'s value to the empty string doesn\'t remove the
value for that property but sets it to the empty string value. This may
not be a valid value for certain properties. In non-delimited text data
formats, it is sensible for the separator to be defined to be the empty
string. This turns off use of separator delimiters. For many other
string-valued properties, it is a Schema Definition Error to assign them
the empty string value. For example, the character set encoding property
(dfdl:encoding) cannot be set to the empty string.

**.2      dfdl:defineFormat - Reusable Data Format Definitions**

To avoid error-prone redundant expression of properties in DFDL schemas,
a collection of DFDL properties can be given a name so that they are
reusable by way of a _format reference_.

One or more dfdl:defineFormat annotation elements can appear within the
annotation children of the xs:schema element.

Each dfdl:defineFormat has a required name attribute.

The construct creates a named data format definition. The value of the
name attribute is of XML type NCName. The format name becomes a member
of the schema\'s target namespace. These names must be unique within the
namespace.

If multiple format definitions have the same \'name\' attribute, in the
same namespace, then it is a Schema Definition Error.

It is a Schema Definition Error if use of the dfdl:ref property results
in a circular path.

\*TODO\* not sure where this \^ should go.

**7.3      The dfdl:defineEscapeScheme Defining Annotation Element**

One or more dfdl:defineEscapeScheme annotation elements can appear
within the annotation children of the xs:schema. It is a Schema
Definition Error if use of the dfdl:ref property results in a circular
path.

7.5.1      **Properties for dfdl:assert**

A dfdl:assert annotation contains a test expression or a test pattern.

It is a Schema Definition Error if a test expression or test pattern is
specified in more than one form.

It is a Schema Definition Error if both a test expression and a test
pattern are specified.

The testKind property specifies whether an expression or pattern is used
by the dfdl:assert. The expression or pattern can be expressed as an
attribute or as a value.

It is a Schema Definition Error if testKind is \'expression\' or not
specified, and an expression is not supplied by either the value of the
dfdl:assert element or the value of the test attribute.

testPattern A DFDL regular expression that is applied against the data
stream starting at the data position corresponding to the beginning of
the representation. Applies when testKind is \'pattern\'.

If the length of the match is zero then the dfdl:assert evaluates to
false and a Processing Error is raised.

If the length of the match is non-zero then the dfdl:assert evaluates to
true.

If a Processing Error occurs during the evaluation of the test regular
expression then the dfdl:assert also fails.

It is a Schema Definition Error if testKind is \'pattern\', and a
pattern is not supplied by either the value of the dfdl:assert element
or the value of the testPattern property.

It is a Schema Definition Error if there is no value for the
dfdl:encoding property in scope.

It is a Schema Definition Error if dfdl:leadingSkip is other than 0.

It is a Schema Definition Error if the dfdl:alignment is not 1 or
\'implicit\'

If a Processing Error or Schema Definition Error occurs while evaluating
the message expression, a Recoverable Error is issued to record this
error (containing implementation-dependent content), then processing of
the assert continues as if there were no problem and in a manner
consistent with the failureType property, but using an
implementation-dependent substitute message.

7.6.1      **Properties for dfdl:discriminator**

Within a dfdl:discriminator, the testKind property specifies whether an
expression or pattern is used by the dfdl:discriminator. The expression
or pattern can be expressed as an attribute or as a value.

It is a Schema Definition Error if the test expression or test pattern
is specified in more than one form.

It is a Schema Definition Error if both a test expression and a test
pattern are specified.

It is a Schema Definition Error if testKind is \'expression\' or not
specified, and an expression is not supplied by either the value of the
dfdl:discriminator element or the value of the test attribute.

It is a Schema Definition Error if testKind is \'expression\' or not
specified, and an expression is not supplied by either the value of the
dfdl:discriminator element or the value of the test attribute.

If the length of the match is zero then the dfdl:discriminator evaluates
to false and a Processing Error is raised.

If the length of the match is non-zero then the dfdl:discriminator
evaluates to true.

It is a Schema Definition Error if testKind is \'pattern\', and a
pattern is not supplied by either the value of the dfdl:discriminator
element or the value of the testPattern property.

It is a Schema Definition Error if there is no value for the
dfdl:encoding property in scope.

It is a Schema Definition Error if dfdl:leadingSkip is other than 0.

It is a Schema Definition Error if the dfdl:alignment is not 1 or
\'implicit\'

If a Processing Error or Schema Definition Error occurs while evaluating
the message expression, a Recoverable Error is issued to record this
error (containing implementation-dependent content), then processing of
the discriminator continues as if there were no problem, but in the case
of failure using an implementation-dependent substitute message.

The resolved set of statement annotations for a schema component can
contain only a single dfdl:discriminator or one or more dfdl:assert
annotations, but not both. It is a Schema Definition Error otherwise. A
defaultValue is optional.

Note that the syntax supports both a defaultValue attribute and the
default value being specified by the element value. Only one or the
other may be present otherwise it is a Schema Definition Error.

A defaultValue expression can refer to other variables but not to the
Infoset. When a defaultValue expression references other variables, the
referenced variables each must either have a defaultValue or be
external. It is a Schema Definition Error otherwise.

7.7.1      **dfdl:defineVariable Annotation Element**

The name of a newly defined global variable is placed into the target
namespace of the schema containing the annotation. A variable can have
any type from the DFDL subset of XML schema simple types. If no type is
specified, the type is xs:string. A defaultValue is optional. The
default value must match the type of the variable (otherwise it is a
Schema Definition Error). If the defaultValue is given by an expression
that expression must not contain any relative path (otherwise it is a
Schema Definition Error).

Note also that the value of the name attribute is an NCName (non-colon
name - that is, may not have a prefix). The name of a variable is
defined in the target namespace of the schema containing the definition.
If multiple dfdl:defineVariable definitions have the same \'name\'
attribute in the same namespace then it is a Schema Definition Error.

If a defaultValue expression references another variable and this causes
a circular reference, it is a Schema Definition Error.

It is a Schema Definition Error if the type of the variable is a
user-defined simple type restriction.

7.7.2      **The dfdl:newVariableInstance Statement Annotation Element**

Scoped instances of defined variables are created using
dfdl:newVariableInstance. All instances share the same name, type, and
default value if provided, but they have distinct storage for separate
values using a stack-like mechanism where a new instance is introduced
for a model group. These new instances are associated with a schema
component using dfdl:newVariableInstance.

The dfdl:newVariableInstance annotation can be used on a group
reference, sequence or choice only. It is a Schema Definition Error
otherwise.

Note that the syntax supports both a defaultValue attribute and the
default value being specified by the annotation element value. Only one
or the other may be present it is a Schema definition error otherwise.

The resolved set of annotations for a component may contain multiple
dfdl:newVariableInstance statements. They must all be for unique
variables; it is a Schema Definition Error otherwise.

7.7.3      **The dfdl:setVariable Statement Annotation Element**

Variable instances get their values either by default, by external
definition, or by subsequent assignment using the dfdl:setVariable
statement annotation.

The dfdl:setVariable annotation can be used on a simple type, group
reference, sequence or choice. It may be used on an element or element
reference only if the element is of simple type. It is a Schema
Definition Error if dfdl:setVariable appears on an element of complex
type, or an element reference to an element of complex type.

The syntax supports both a value attribute and the \'value\' being
specified by the element value. Only one or the other may be present
otherwise it is a Schema Definition Error.

The value of an instance can only be set once using dfdl:setVariable. 
Attempting to set the value of the variable instance for a second time
is a Schema Definition Error.

The resolved set of annotations for an annotation point may contain
multiple dfdl:setVariable statements. They must all be for unique
variables (different name and/or namespace) it is a Schema Definition
Error otherwise.

8.1.3      **Combining DFDL Representation Properties from a
dfdl:defineFormat**

The DFDL representation properties contained in a referenced
dfdl:defineFormat are combined with any DFDL representation properties
defined locally on a construct as if they had been defined locally. If
the same property is defined locally in and in the
referenced.dfdl:defineFormat then the local property takes precedence.
The combined set of explicit DFDL properties has precedence over any
defaults set by a dfdl:format on the xs:schema.

It is a Schema Definition Error if a required property is in neither the
\"explicit\" nor the \"default\" working sets.

It is a Schema Definition Error if the same property appears twice.

**10   Overview: Representation Properties and their Format Semantics**

It is a Schema Definition Error when a DFDL schema does _not_ contain a
definition for a representation property that is needed to interpret the
data.

**11.3   Byte Order and Bit Order**

Byte order and bit order are separate concepts. However, of the possible
combinations, only the following are allowed:

1.  'bigEndian' with 'mostSignificantBitFirst'

2.  'littleEndian' with 'mostSignificantBitFirst'

3.  'littleEndian' with 'leastSignificantBitFirst'

Other combinations will produce Schema Definition Errors.

12.1.2    **Mandatory Alignment for Textual Data**

When processing textual data, it is a Schema Definition Error if the
dfdl:alignment and dfdl:alignmentUnits properties are used to specify
alignment that is not a multiple of the encoding-specified mandatory
alignment.

12.1.3    **Mandatory Alignment for Packed Decimal Data**

Packed decimal data is data with
dfdl:binaryNumberRep[\[37\]](https://daffodil.apache.org/docs/dfdl/#_ftn37)
values of \'packed\', \'ibm4690Packed\' or \'bcd\'. This representation
stores a decimal digit in a 4 bit nibble. These nibbles must have a
multiple of 4-bit alignment. It is a Schema Definition Error otherwise.

**12.2   Properties for Specifying Delimiters**

The Initiator property can be computed by way of an expression which
returns a string containing a whitespace separated list of DFDL String
Literals. It is a Schema Definition Error to return an empty string or a
string containing only whitespace.

Each string literal in the list, whether apparent in the schema, or
returned as the value of an expression, is restricted to allow only
certain kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed.

·         DFDL Byte Value entities ( %#rXX; ) are allowed.

·         DFDL Character Classes NL, WSP, WSP+, WSP\*, and ES are
allowed.

·         If the ES entity or the WSP\* entity appear alone as one of
the string literals in the list, then dfdl:initiatedContent must be
\"no\". This restriction ensures that when dfdl:initiatedContent is
\'yes\' that the initiator cannot match zero-length data.

If the above rules are not followed it is a Schema Definition Error.

A terminator specifies an ordered whitespace separated list of
alternative text strings that one of which marks the end of an element
or group of elements.

Each string literal in the list, whether apparent in the schema, or
returned as the value of an expression, is restricted to allow only
certain kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed.

·         DFDL Byte Value entities ( %#rXX; ) are allowed.

·         DFDL Character Classes NL, WSP, WSP+, WSP\*, and ES are
allowed.

·         Neither the ES entity nor the WSP\* entity may appear on their
own as one of the string literals in the list when the parser is
determining the length of a component by scanning for delimiters.

If the above rules are not followed it is a Schema Definition Error.

If dfdl:terminator is \"\" (the empty string), that is the way a DFDL
schema expresses a format which does not use terminators. It is a Schema
Definition Error for a terminator expression to return an empty string

The emptyValueDelimiterPolicy Indicates that when an element in the data
stream is empty, which of initiator, terminator, both, or neither must
be present.

It is a Schema Definition Error if dfdl:emptyValueDelimiterPolicy set to
\'none\' or \'terminator\' when the parent group has
dfdl:initiatedContent \'yes\'.

If there is a dfdl:initiator or dfdl:terminator in scope, and
dfdl:emptyValueDelimiterPolicy is not set, it is a Schema Definition
Error.

f dfdl:initiator is not \"\" and dfdl:terminator is \"\" and
dfdl:emptyValueDelimiterPolicy is \'terminator\' it is a Schema
Definition Error.

If dfdl:terminator is not \"\" and dfdl:initiator is \"" and
dfdl:emptyValueDelimiterPolicy is \'initiator\' it is a Schema
Definition Error. It is a Schema Definition Error if
dfdl:emptyValueDelimiterPolicy is in effect and is set to \'none\' or
\'terminator\' when the parent xs:sequence has dfdl:initiatedContent
\'yes\'.

Note: It is not a Schema Definition Error if
dfdl:emptyValueDelimiterPolicy is \'both\' and one or both of
dfdl:initiator and dfdl:terminator is \"\". This is to accommodate the
common use of setting \'both\' as a schema-wide setting.

The outputNewLine DFDL String Literal or DFDL Expression specifies the
character or characters that are used to replace the %NL; character
class entity during unparse.

It is a Schema Definition Error if any of the characters are not in the
set of characters allowed by the DFDL entity %NL; Only individual
characters or the %CR;%LF; combination are allowed.

It is a Schema Definition Error if the DFDL entity %NL; is specified.

12.3.3    **dfdl:lengthKind \'implicit\'**

When dfdl:lengthKind is \'implicit\', the length is determined in terms
of the type of the element and its schema-specified properties.

A dfdl:lengthKind property of \'Not Allowed\' means that there is no
implicit length for the combination of simple type and representation,
and it is a Schema Definition Error if dfdl:lengthKind  \'implicit\' is
specified

It is a Schema Definition Error if type is xs:string and dfdl:lengthKind
is \'implicit\' and dfdl:lengthUnits is \'bytes\' and encoding is not an
SBCS (exactly 1 byte per character code) encoding.

12.3.4    **dfdl:lengthKind \'prefixed\'**

When dfdl:lengthKind is \'prefixed\' the length of the element is given
by the integer value of the PrefixLength region specified using
dfdl:prefixLengthType.

It is a Schema Definition Error if prefixLengthType of xs:simpleType
pecifies any of:

- dfdl:lengthKind \'delimited\', \'endOfParent\', or \'pattern\'

- dfdl:lengthKind \'explicit\' where length is an expression

- dfdl:outputValueCalc

- dfdl:initiator or dfdl:terminator other than empty string

- dfdl:alignment other than \'1\'

- dfdl:leadingSkip or dfdl:trailingSkip other than \'0

  12.3.4.1    **Nested Prefix Lengths**

It is possible for a prefix length, as specified by
dfdl:prefixLengthType, to itself have a prefix length. It is a Schema
Definition Error if this nesting exceeds 1 deep.

It is a Schema Definition Error unless the type associated with the
PrefixPrefixLength is different from the type associated with the
PrefixLength.

The DFDL Regular Expression lengthPattern is only used when lengthKind
is 'pattern'.

It is a Schema Definition Error if there is no value for the
dfdl:encoding property in scope

12.3.6    **dfdl:lengthKind \'endOfParent\'**

The dfdl:lengthKind \'endOfParent\' means that the element is terminated
either by the end of the data stream, or the end of an enclosing complex
element with dfdl:lengthKind 'explicit', 'pattern', 'prefixed' or
'endOfParent', or the end of an enclosing choice with
dfdl:choiceLengthKind 'explicit'.

It is a Schema Definition Error if:

·         the element has a terminator.

·         the element has dfdl:trailingSkip not equal to 0.

·         the element has maxOccurs \> 1.

·         any other model-group is defined between this element and the
end of the enclosing component.

·         any other represented element is defined between this element
and the end of the enclosing component.

·         the parent is an element with dfdl:lengthKind \'implicit\' or
\'delimited\'.

·         the element has text representation, does not have a
single-byte character set encoding, and the effective length units of
the parent is not 'characters'.

·        The effective length units of the parent are:

> o    dfdl:lengthUnits if parent is an element with dfdl:lengthKind
> 'explicit' or 'prefixed';
>
> o    'characters' if parent is an element with dfdl:lengthKind
> 'pattern';
>
> o    'bytes' if parent is a choice with dfdl:choiceLengthKind
> 'explicit';  
>
> o    'characters' if the element is the document root;
>
> o    the effective length units of the parent's parent if parent is an
> element with dfdl:lengthKind 'endOfParent'

If the element is in a sequence then it is a Schema Definition Error if:

·         the dfdl:separatorPosition of the sequence is \'postfix\'

·         the dfdl:sequenceKind of the sequence is not \'ordered\'

·         the sequence has a terminator

·         there are floating elements in the sequence

·         the sequence has a non-zero dfdl:trailingSkip

If the element is in a choice where dfdl:choiceLengthKind is
\'implicit\' then it is a Schema Definition Error if:

·         the choice has a terminator

·         the choice has a non-zero dfdl:trailingSkip

12.3.7    **Elements of Specified Length**

An element has a specified length when dfdl:lengthKind is \'explicit\',
\'implicit\' (simple type only)  or \'prefixed\'.

For a simple element, dfdl:lengthUnits \'characters\' may only be used
for textual elements, otherwise it is a Schema Definition Error.

**12.3.7.1.1   Text Length Specified in Bytes**

If a textual element has dfdl:lengthUnits of \'bytes\', and the
dfdl:encoding is not SBCS, then it is possible for a partial character
encoding to appear after the code units of the characters.

It is a Schema Definition Error if type is xs:string and
dfdl:textPadKind is not \'none\' and dfdl:lengthUnits is \'bytes\' and
dfdl:encoding is not an SBCS encoding and the XSD minLength facet is not
zero. This prevents a scenario where validation against the XSD
minLength facet is in characters, but padding would be performed in
bytes.

12.3.7.2    **Length of Simple Elements with Binary Representation**

The dfdl:lengthKind properties \'explicit\' and \'prefixed\' specify
lengths for the different binary representations. When dfdl:lengthKind
is \'implicit\' the dfdl:lengthUnits can be \'bytes\' or \'bits\' unless
otherwise stated. It is Schema Definition Error if dfdl:lengthUnits is
\'characters\'.

he dfdl:lengthUnits can be \'bytes\' or \'bits\' unless otherwise
stated. It is Schema Definition Error if dfdl:lengthUnits is
\'characters\'.

**12.3.7.2.2   Length of Floating Point Binary Number Elements**

For binary elements of types xs:float or xs:double, a specified length
must be either exactly 4 bytes or exactly 8 bytes respectively.

The dfdl:lengthUnits property must be \'bytes\'. It is a Schema
Definition Error otherwise.

**12.3.7.2.3   Length of Packed Decimal Number Elements**

Non-floating-point numbers with binary representation and
dfdl:binaryNumberRep \'packed\', \'bcd\', or \'ibm4690Packed\', are
represented as a bit string of 4 bit nibbles. The term _packed decimal_
is used to describe such numbers.

It is a Schema Definition Error if the specified length is not a
multiple of 4 bits.

**12.3.7.2.5   Length of Base-2 Binary Calendar Elements**

Calendars (types date, time, dateTime) with binary representation and
dfdl:binaryCalendarRep 'binarySeconds' or 'binaryMilliseconds' are
represented as a bit string which contains a base-2 representation. The
specified length must be either exactly 4 bytes or exactly 8 bytes
respectively.

The dfdl:lengthUnits property must be \'bytes\'. It is a Schema
Definition Error otherwise.

**12.3.7.2.6   Length of Packed Decimal Calendar Elements**

Calendars (types date, time, dateTime) with binary representation and
dfdl:binaryCalendarRep \'packed\', \'bcd\', or \'ibm4690Packed\', are
represented as a bit string of 4-bit nibbles. The term _packed decimal_
is used to describe such calendars.

It is a Schema Definition Error if the specified length is not a
multiple of 4 bits.

**12.3.7.2.7   Length of Binary Opaque Elements**

The dfdl:lengthUnits property must be \'bytes\'. It is a Schema
Definition Error otherwise.

12.3.7.3    **Length of Complex Elements**

A complex element of specified length is defining a \'box\' in which its
child elements exist. An example of this would be a fixed-length record
element with a variable number of children elements. The
dfdl:lengthUnits may be \'bytes\' or \'characters\', it is a Schema
Definition Error otherwise.

The dfdl:escapeScheme annotation is used within a
dfdl:defineEscapeScheme annotation to group the properties of an escape
scheme and allows a common set of properties to be defined that can be
reused.

The escapeCharacter property specifies one character that escapes the
subsequent character.

It is a Schema Definition Error if dfdl:escapeCharacter is empty when
dfdl:escapeKind is \'escapeCharacter\'

_Escape and Quoting Character Restrictions:_ The string literal is
restricted to allow only certain kinds of DFDL String Literal syntax:

- DFDL character entities are allowed

- The DFDL byte value entity ( %#rXX; ) is not allowed

- DFDL Character classes  NL, WSP, WSP+, WSP\*, and ES are not allowed

It is a Schema Definition Error if the string literal contains any of
the disallowed constructs.

The escapeBlockStart property contains the string of characters that
denotes the beginning of a sequence of characters escaped by a pair of
escape strings.

It is a Schema Definition Error if dfdl:escapeBlockStart is empty when
dfdl:escapeKind is \'escapeBlock\'

The string literal value is restricted in the same way as described in
\"Escape and Quoting Character Restrictions\" in the description of the
dfdl:escapeCharacter property.

The escapeBlockEnd property contains the string of characters that
denotes the end of a sequence of characters escaped by a pair of escape
strings.

It is a Schema Definition Error if dfdl:escapeBlockEnd is empty when
dfdl:escapeKind is \'escapeBlock\'.

**13.4   Properties Specific to String**

The textStringPadCharacter property contains the value that is used when
padding or trimming string elements. The value can be a single character
or a single byte.

If a character, then it can be specified using a literal character or
using DFDL entities.

If a byte, then it must be specified using a single byte value entity
otherwise it is a Schema Definition Error

_Padding Character Restrictions:_ The string literal is restricted to
allow only certain kinds of DFDL String Literal syntax:

- DFDL character entities are allowed

- The DFDL byte value entity ( %#rXX; ) is allowed.

- DFDL Character classes NL, WSP, WSP+, WSP\*, and ES are not allowed

It is a Schema Definition Error if the string literal contains any of
the disallowed syntax.

**13.6   Properties Specific to Number with Text Representation**

The valid values for the are textNumberRep property \'standard\',
\'zoned\'

\'standard\' means represented as characters in the character set
encoding specified by the dfdl:encoding property.

\'zoned\' means represented as a zoned decimal in the character set
encoding specified by the dfdl:encoding property.

Zoned is not supported for float and double numbers. Base 10 is assumed,
and the encoding must be for an EBCDIC or ASCII compatible encoding. It
is a Schema Definition Error if any of these requirements are not met.

The textNumberRoundingIncrement property specifies the rounding
increment to use during unparsing, when dfdl:textNumberRounding is
\'explicit\'.

A negative value is a Schema Definition Error.

The textStandardDecimalSeparator s the punctuation mark which separates
the integer part of a decimal or floating point number from the
fractional part. It is usually a period or comma depending on locale of
the data. This property defines a whitespace separated list of single
characters that appear (individually) in the data as the decimal
separator.

When dfdl:textNumberRep is \'standard\' and dfdl:textStandardBase is 10.
It must be set if  dfdl:textNumberPattern contains a decimal separator
symbol (\".\"), or the E or @ symbols, otherwise it is a
SchemaDefinitionError.

_Text Number Character Restrictions:_ The string literal is restricted
to allow only certain kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed

·         The DFDL byte value entity ( %#rXX; ) is not allowed.

·         DFDL Character classes NL, WSP, WSP+, WSP\*, and ES are not
allowed

It is a Schema Definition Error if the string literal contains any of
the disallowed syntax constructs.

It is a Schema Definition Error if any of the string literal values for
this property are digits 0-9.

The textStandardGroupingSeparator is the punctuation mark which
separates the clusters of integer digits to improve readability.

This property is applicable when dfdl:textNumberRep is \'standard\' and
dfdl:textStandardBase is 10. It must be set if  dfdl:textNumberPattern
contains a grouping separator symbol otherwise it is a Schema Definition
Error.

The textStandardExponentRep property defines the actual character(s)
that appear in the data as the exponent indicator. If the empty string
is specified then no exponent character is used.

It is a Schema Definition Error if this property is not set or in scope
for any number with dfdl:representation \'text\'.

The textStandardInfinityRep property contains the value used to
represent infinity.

It is a Schema Definition Error if empty string found as the property
value.

The textStandardNaNRep property contains the value used to represent
NaN.

It is a Schema Definition Error if empty string found as the property
value.

The textStandardZeroRep property contains the whitespace separated list
of alternative DFDL String Literals that are equivalent to zero. The
valid values are empty string, any character string.

Each string literal in the list is restricted to allow only certain
kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed.

·         DFDL Byte Value entities ( %#rXX; ) are not allowed.

·         DFDL Character class entities NL and ES are not allowed.

·         DFDL Character class entities WSP, WSP+, and WSP\* are
allowed.

However, the WSP\* entity cannot appear on its own as one of the string
literals in the list. It must be used in combination with other text
characters or entities so as to describe a representation that cannot
ever be an empty string.

It is a Schema Definition Error if the string literal contains any of
the disallowed syntax constructs.

Annotation: dfdl:element, dfdl:simpleType

13.6.1    **The dfdl:textNumberPattern Property**

The dfdl:textStandardDecimalSeparator,
dfdl:textStandardGroupingSeparator, dfdl:textStandardExponentRep,
dfdl:textStandardInfinityRep, dfdl:textStandardNaNRep, and
dfdl:textStandardZeroRep must all be distinct, and it is a Schema
Definition Error otherwise.

13.6.1.1    **dfdl:textNumberPattern for dfdl:textNumberRep
\'standard\'**

The dfdl:textNumberPattern property contains a positive and negative
subpattern. Each subpattern has a prefix, a numeric part, and a suffix.
If there is no explicit negative subpattern, the negative subpattern is
the minus sign prefixed to the positive subpattern.

It is a Schema Definition Error if any symbols other than \"0\", \"1\"
through \"9\" or \# are used in the vpinteger region of the pattern.

Significant digits may be used together with exponential notation. The
\'@\' pattern character can be used only in \'standard\' textNumberRep
(not \'zoned\') and excludes the \'P\' and \'V\' pattern characters. It
is a Schema Definition Error if the \'@\' pattern character appears in
\'zoned\' textNumberRep, or in conjunction with the \'P\' or \'V\'
pattern characters.

13.6.1.2    **dfdl:textNumberPattern for dfdl:textNumberRep \'zoned\'**

When dfdl:textNumberRep is \'zoned\' a subset of the number pattern
language is used. Only the pattern for positive numbers is used. It is a
Schema Definition Error if the negative pattern is specified.

A \'+\' may be present at the beginning or end of the pattern to
indicate whether the leading or trailing digit carries the overpunched
sign, if the logical type is unsigned. If logical type is unsigned and
dfdl:textNumberPolicy \'lax\' specified it is a Schema Definition Error
if no \'+\' is present.

**13.8   Properties Specific to Float/Double with Binary
Representation**

The binaryFloatProperty specifies the encoding method for the float and
double. Valid values are \'ieee\', \'ibm390Hex\'.

For both \'ieee\' and \'ibm390hex\', an xs:float must have a physical
length of 4 bytes. It is a Schema Definition Error if there is a
specified length not equivalent to 4 bytes

For both \'ieee\' and \'ibm390hex\', an xs:double must have a physical
length of 8 bytes. It is a Schema Definition Error if there is a
specified length not equivalent to 8 bytes.

**13.9   Properties Specific to Boolean with Text Representation**

The textBooleanTrueRep property contains a whitespace separated list of
representations to be used for \'true\'. These are compared after
trimming when parsing, and before padding when unparsing.

If dfdl:lengthKind is \'explicit\' or \'implicit\' and either
dfdl:textPadKind or dfdl:textTrimKind  is \'none\' then both
dfdl:textBooleanTrueRep and dfdl:textBooleanFalseRep must have the same
length else it is a Schema Definition Error.

_Text Boolean Character Restrictions:_ The string literal is restricted
to allow only certain kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed

·         The DFDL byte value entity ( %#rXX; ) is not allowed.

·         DFDL Character classes  NL, WSP, WSP+, WSP\*, and ES are not
allowed

It is a Schema Definition Error if the string literal is the empty
string or contains any of the disallowed constructs.

The textBooleanFalseRep property contains a whitespace separated list of
representations to be used for \'false\' These are compared after
trimming when parsing, and before padding when unparsing. 

If dfdl:lengthKind is \'explicit\' or \'implicit\' and either
dfdl:textPadKind or dfdl:textTrimKind  is \'none\' then both
dfdl:textBooleanTrueRep and dfdl:textBooleanFalseRep must have the same
length else it is a Schema Definition Error.

**13.10   Properties Specific to Boolean with Binary Representation**

The binaryBooleanTrueRep property gives the representation to be used
for \'true\'.

The length of the data value of the element must be between 1 bit and 32
bits (4 bytes) as described in Section 12.3.7.2. It is a Schema
Definition Error if the value (when provided) of
dfdl:binaryBooleanTrueRep cannot fit as an unsigned binary integer in
the specified length.

The binaryBooleanFalseRep property gives the representation to be used
for \'false\'

The length of the data value of the element must be between 1 bit and 32
bits (4 bytes) as described in Section 12.3.7.2. It is a Schema
Definition Error if the value of dfdl:binaryBooleanFalseRep cannot fit
as an unsigned binary integer in the specified length.

**13.11   Properties Specific to Calendar with Text or Binary
Representation**

The calendarLanguage property represents the language that is used when
the pattern produces a presentation in text such as for names of the
months, and names of days of the week.

The value must match the regular expression:

(\[A-Za-z\]{1,8}(\[\\-\_\]\[A-Za-z0-9\]{1,8})\*)

It is a Schema Definition Error otherwise.

**13.13   Properties Specific to Calendar with Binary Representation**

The binaryCalendarRep property valid values are \'packed\', \'bcd\',
\'ibm4690Packed\', \'binarySeconds\', \'binaryMilliseconds\' .

For all these packed decimals, dfdl:calendarPattern can contain only
characters and symbols that always result in the presentation of digits.
It is a Schema Definition Error otherwise. This implies that property
dfdl:calendarPatternKind must be \'explicit\' because the default
patterns for \'implicit\' contain non-numeric characters. It is a Schema
Definition Error otherwise.

Note also that a virtual decimal point for the boundary between seconds
and fractional seconds is implied from the pattern at the boundary of
\'s\' and \'S\', i.e., where the substring \'sS\' appears in the
pattern.

·         \'binarySeconds\' means represented as binary xs:int, that is,
as a 4 byte signed integer that is the number of seconds from the epoch
(positive or negative).  It is a Schema Definition Error if there is a
specified length not equivalent to 4 bytes.

·         \'binaryMilliseconds\' means represented as binary xs:long,
that is, as an 8 byte signed integer that is the number of milliseconds
from the epoch (positive or negative).  It is a Schema Definition Error
if there is a specified length not equivalent to 8 bytes.  

Values binarySeconds and binaryMilliseconds may only be used when the
type is xs:dateTime. (It is a Schema Definition Error otherwise.)

**13.16   Properties for Nillable Elements**

The nilKind property specifies how dfdl:nilValue is interpreted to
represent the nil value in the data stream.

If \'literalCharacter\' then dfdl:nilValue specifies a single character
or a single byte that, when repeated to the length of the element, is
the nil value. \'literalCharacter\' may only be specified for
fixed-length elements, otherwise it is a Schema Definition Error.

Complex elements can be nillable, but dfdl:nilKind can only be
\'literalValue\' and dfdl:nilValue must be \"%ES;\". It is a Schema
Definition Error otherwise.

The nilValue property specifies the text strings that are the possible
literal or logical nil values of the element.

Complex elements can be nillable, but dfdl:nilKind can only be
\'literalValue\' and dfdl:nilValue must be \"%ES;\". It is a Schema
Definition Error otherwise

The nilValueDelimiterPolicy property enables distinguishing the nil
representation from the representation of a value or an empty
representation based on presence or absence of the initiator and
terminator.

The value of dfdl:nilValueDelimiterPolicy MUST only be checked if there
is a dfdl:initiator or dfdl:terminator in scope. If so, and
dfdl:nilValueDelimiterPolicy is not set, it is a Schema Definition
Error. If dfdl:initiator is not \"\" and dfdl:terminator is \"\" and
dfdl:nilValueDelimiterPolicy is \'terminator\' it is a Schema Definition
Error. If dfdl:terminator is not \"\" and dfdl:initiator is \"" and
dfdl:nilValueDelimiterPolicy is \'initiator\' it is a Schema Definition
Error. It is not a Schema Definition Error if
dfdl:nilValueDelimiterPolicy is \'both\' and one or both of
dfdl:initiator and dfdl:terminator is \"\". This is to accommodate the
common use of setting \'both\' as a schema-wide setting.

It is a Schema Definition Error if dfdl:nilValueDelimiterPolicy is set
to \'none\' or \'terminator\' when the parent xs:sequence has
dfdl:initiatedContent \'yes\'.

The useNilForDefault property ontrols whether to set the Infoset item
**\[nilled\]** boolean member, or to use the XSD default or fixed
properties to obtain a data value

The dfdl:nilValue property must specify at least one nil value otherwise
it is a Schema Definition Error.

**14   Sequence Groups**

The following properties are specific to sequences

The sequenceKind property valid values are \'ordered\', \'unordered\'.
When \'ordered\', this property means that the contained items of the
sequence are expected in the same order that they appear in the schema,
which is called schema-definition-order.

When \'unordered\', this property means that the items of the sequence
are expected in any order. Repeating occurrences of the same element do
not need to be contiguous. The children of an unordered sequence must be
xs:element otherwise it is a Schema Definition Error.

The initiatedContent property vValid values are \'yes\', \'no\'. When
\'yes\' indicates that all the children of the sequence are initiated.
It is a Schema Definition Error if any children have their
dfdl:initiator property set to the empty string.

If the child is optional then it is known to exist when its initiator
has been found. Any subsequent error parsing the child does not cause
the parser to backtrack to try other alternatives.

When \'no\', the children of the sequence may have their dfdl:initiator
property set to the empty string.

**14.1   Empty Sequences**

A sequence having no children is syntactically legal in DFDL.

It is a Processing Error if the SequenceContent region of an empty
sequence has non-zero length when parsing.

XML schema does not define an empty sequence that is the content model
of a complex type definition as effective content so any DFDL
annotations on such a construct would be ignored. It is a Schema
Definition Error if the empty sequence is the content model of a complex
type, or if a complex type has nothing in its content model at all.

It is a Schema Definition Error if an empty sequence group appears as
the model group of a complex type.

**14.2   Sequence Groups with Separators**

Additional properties apply to sequence groups that use text delimiters
to separate one occurrence of a member of the group from the next.

Sequence separator rules:

1.  A separator has alternative potential representations in the data.

2.  A separator is placed before, after, or between occurrences in the
    data.

3.  Separators are used to indicate the position of occurrences in the
    data

These requirements are addressed by the properties dfdl:separator,
dfdl:separatorPosition and dfdl:separatorSuppressionPolicy, as described
below.

These properties combine to define the syntax for a sequence group with
dfdl:sequenceKind \'ordered\'. Not all combinations of the properties
give rise to consistent syntax, so some combinations are disallowed and
give rise to a Schema Definition Error.

The separator property specifies a whitespace separated list of
alternative DFDL String Literals that are the possible separators for
the sequence.

It is a Schema Definition Error if the expression returns an empty
string.

Each string literal in the list, whether apparent in the schema, or
returned as the value of an expression, is restricted to allow only
certain kinds of DFDL String Literal syntax:

·         DFDL character entities are allowed.

·         DFDL Byte Value entities ( %#rXX; ) are allowed.

·         DFDL Character Class ES is not allowed.

·         DFDL Character Classes NL, WSP, WSP+, and WSP\* are allowed.

·         The WSP\* entity cannot appear on its own as one of the string
literals in the list when determining the length of a component by
scanning for delimiters.

If the above rules are not followed it is a Schema Definition Error.

14.2.2    **Parsing Sequence Groups with Separators**

When dfdl:occursCountKind is \'parsed\' any number of occurrences and
their separators are expected. The dfdl:separatorSuppressionPolicy of
the sequence must be \'anyEmpty\' and it is a Schema Definition Error
otherwise.

14.2.3    **Unparsing Sequence Groups with Separators**

When dfdl:occursCountKind is \'parsed\' non zero-length occurrences in
the augmented Infoset are output along with their separators. The
dfdl:separatorSuppressionPolicy of the sequence must be \'anyEmpty\' and
it is a Schema Definition Error otherwise.

**14.3   Unordered Sequence Groups**

14.3.1    ** \*\***Restrictions for Unordered Sequences\*\*

t is a Schema Definition Error if any member of the unordered sequence
is not an element declaration or an element reference.

It is a Schema Definition Error if a member of an unordered sequence is
an optional element or an array element and its dfdl:occursCountKind
property is not \'parsed\'

It is a Schema Definition Error if two or more members of the unordered
sequence have the same name and the same namespace (see post-processing
transformation below)

It is a Schema Definition Error if an unordered sequence has no members.

**14.4   Floating Elements**

The floating property specifies whether the occurrences of an element in
an ordered sequence can appear out-of-order in the representation. Valid
values are \'yes\', \'no\'.

It is a Schema Definition Error if an unordered sequence or a choice
contains any element with dfdl:floating \'yes\'.

It is a Schema Definition Error if an ordered sequence contains any
element with dfdl:floating \'yes\' and also contains non-element
component  (such as a choice or sequence model group).

It is a Schema Definition Error if an element with dfdl:floating \'yes\'
is an optional element or an array element and its dfdl:occursCountKind
property is not \'parsed\'

It is a Schema Definition Error if two or more elements with
dfdl:floating \'yes\' in the same group have the same name and the same
namespace.

**14.5   Hidden Groups**

When the dfdl:hiddenGroupRef property is specified on an xs:sequence
schema component, the appearance of any other DFDL properties on that
component is a Schema Definition Error. It is also a Schema Definition
Error if the sequence is not empty.

It is a Schema Definition Error if the sequence is the only thing in the
content model of a complex type definition.

It is a Schema Definition Error if dfdl:hiddenGroupRef appears on a
xs:group reference, that is, unlike most format properties that apply to
sequences, dfdl:hiddenGroupRef cannot be combined from a xs:group
reference.

The hiddenGroupRef property is a reference to a global model group
definition. Elements within this model group are not added to the
Infoset and are called hidden elements.

It is a Schema Definition Error if the value is the empty string.

When unparsing a hidden group, the behaviour is the same as when
elements are missing from the Infoset; that is, the default-values
algorithm applies. The only difference is that if a required element
does not have a default value or a dfdl:outputValueCalc then it is a
Schema Definition Error instead of a Processing Error. Note that this
can be checked statically. 

When unparsing a hidden group, it is a Processing Error if an element
information item is provided in the Infoset for a hidden element.

**15   Choice Groups**

A choice corresponds to concepts variously called variant records,
multi-format records, discriminated unions, or tagged unions in various
programming languages.

The Root of the Branch must not be optional. That is XSD minOccurs must
be greater than zero.

A choice that declares no branches in the DFDL schema is a Schema
Definition Error.

When processing a choice group, the parser validates any contained path
expressions. If a path expression contained inside a choice branch
refers to any other branch of the choice, then it is a Schema Definition
Error. Note that this rule handles nested choices also. A path that
navigates outward from an inner choice to another alternative of an
outer choice is violating this rule with respect to the outer choice.

The initiatedContent property indicates whether all the branches of the
choice are initiated. Valid values are \'yes\', \'no\'.

When \'yes\' indicates that all the branches of the choice are
initiated. It is a Schema Definition Error if any children have their
dfdl:initiator property set to the empty string.

The choiceDispatchKey property string must match one of the
dfdl:choiceBranchKey property values of one of the branches of the
choice.

The expression must evaluate to an xs:string. It is a Schema Definition
Error if the expression returns an empty string.

It is a Schema Definition Error if the expression contains forward
references to elements which have not yet been processed.

It is a Processing Error if the value of the expression does not match
any of the dfdl:choiceBranchKey property values for any of the branches.

It is a Schema Definition Error if any choice branch does not specify a
dfdl:choiceBranchKey in a choice that carries choiceDispatchKey.

The choiceBranchKey property provides an alternate way to discriminate a
choice to a branch.

It is a Schema Definition Error if individual dfdl:choiceBranchKey
values are not unique across all branches of a choice that carries
dfdl:choiceDispatchKey.

It is a Schema Definition Error if dfdl:choiceBranchKey is specified on
a global element, or on a sequence or choice that is the child of a
global group definition.

It is a Schema Definition Error if any choice branch does not specify a
dfdl:choiceBranchKey in a choice that carries choiceDispatchKey.

15.1.2    **Resolving Choices via Direct Dispatch**

Direct dispatch provides a constant-time dispatch to a choice branch
independent of how many choice branches there are.

Direct dispatch is indicated by the dfdl:choiceDispatchKey property.

The dfdl:choiceBranchKey property can be placed on element references,
local element declarations, local sequences, local choices, or group
references. All values of dfdl:choiceBranchKey properties must be unique
across all branches of a choice that carries a dfdl:choiceDispatchKey
property and it is a Schema Definition Error otherwise.

Note that it is a Schema Definition Error if both dfdl:initiatedContent
and dfdl:choiceDispatchKey are provided on the same choice. However, it
is not an error if a discriminator exists on a choice branch along with
a dfdl:choiceBranchKey.

15.1.3.1    **Unparsing Choices in Hidden Groups**

When a choice appears inside a hidden group, there are no corresponding
Infoset elements as there are none for hidden groups. The first branch
of the choice is unparsed. All elements contained in the branch must
have default values or must have dfdl:outputValueCalc properties to
compute their values, and it is a Schema Definition Error otherwise.

**16.1   The** **dfdl:occursCountKind property**

16.1.1    **dfdl:occursCountKind \'fixed\'**

It is a Schema Definition Error if XSD minOccurs is not equal to XSD
maxOccurs.

16.1.4    **dfdl:occursCountKind \'expression\'**

It is a Schema Definition Error if dfdl:occursCount is not provided or
in scope.

16.1.5    **dfdl:occursCountKind \'stopValue\'**

It is a Schema Definition Error if dfdl:occursStopValue is not provided
or in scope.

It is a Schema Definition Error if the type of the element is complex.

It is a Schema Definition Error if any of the stop values provided by
dfdl:occursStopValue do not conform to the simple type of the element.

 

**17   Calculated Value Properties**

The inputValueCalc property contains an expression that calculates the
value of the element when parsing.

It is a Schema Definition Error if the result type of the expression
does not conform to the base type of the element.

It is a Schema Definition Error if this property is specified on an
element which has an XSD fixed or default property.

It is a Schema Definition Error if dfdl:inputValueCalc and
dfdl:outputValueCalc are specified on the same element.

If this property appears on an element declaration or element reference
schema component, the appearance of any other DFDL properties on that
component is a Schema Definition Error.

The outputValueCalc property is an expression that calculates the value
of the current element when unparsing.

It is a Schema Definition Error if the result type of the expression
does not conform to the base type of the element.

It is a Schema Definition Error if dfdl:outputValueCalc is specified on
an element which has an XSD fixed or default property.

It is a Schema Definition Error if dfdl:inputValueCalc and
dfdl:outputValueCalc are specified on the same element.

18.2.2    **Variable Memory State Transitions**

It is a Schema Definition Error if a dfdl:setVariable or a variable
reference occurs and there is no corresponding variable name defined by
a dfdl:defineVariable annotation.

It is a Schema Definition Error if a dfdl:setVariable provides a value
of incorrect type which does not correspond to the type specified by the
dfdl:defineVariable.

It is a Schema Definition Error if a variable reference in an expression
is able to return a value of incorrect type for the evaluation of that
expression. That is, DFDL - including the expressions contained in it -
is a statically type-checkable language. DFDL implementations SHOULD
issue these Schema Definition Errors prior to processing time if
possible.

**18.3   General Syntax**

DFDL expressions follow the XPath 2.0 syntax rules but are always
enclosed in curly braces \"{\" and \"}\".

The syntax \"{}\" is a Schema Definition Error as it results in an empty
XPath 2.0 expression which is not legal.

The result of evaluating the expression must be a single atomic value of
the type expected by the context, and it is a Schema Definition Error
otherwise. Some XPath expressions naturally return a sequence of values,
and in this case, it is also Schema Definition Error if an expression
returns a sequence containing more than one item.

**18.4   DFDL Expression Syntax**

Predicates are only used to index arrays and so must be integer
expressions otherwise a Schema Definition Error occurs.

**18.5   Constructors, Functions and Operators**

The arguments to the constructors are all of type xs:anyAtomicType.
Since the expression language can be statically type checked, it is a
Schema Definition Error if the type of the argument is not one of the
DFDL-supported subtypes of xs:anyAtomicType.

If the argument for the function below includes the current node, or any
enclosing parent node, then it is a Schema Definition Error.

fn:empty(\$arg?)

fn:exists(\$arg?)

fn:exactly‑one(\$arg?)

fn:count(\$arg)

18.5.3    **DFDL Functions**

dfdl:contentLength(\$node, \$lengthUnits)

The second argument is of type xs:string and must be \'bytes\',
\'characters\', or \'bits\', otherwise it is a Schema Definition Error.

dfdl:valueLength(\$node, \$lengthUnits)

The second argument is of type xs:string and must be \'bytes\',
\'characters\', or \'bits\', otherwise it is a Schema Definition Error.

dfdl:occursIndex()

It is a Schema Definition Error if this function is called when there is
no enclosing array element.

dfdl:checkConstraints(\$node)

It is a Schema Definition Error if the argument is a complex element.

dfdl:decodeDFDLEntities (\$arg)

t is a Schema Definition Error if \$arg contains syntax matching DFDL
Byte Value Entities syntax.

dfdl:checkRangeInclusive(\$node, \$val1, \$val2)\
dfdl:checkRangeExclusive(\$node, \$val1, \$val2)

The type of \$val1 and \$val2 must be compatible with the type of
\$node, and must be a derivative of xs:decimal, xs:float or xs:double.
It is a Schema Definition Error if the \$node argument is a complex
element.

dfdl:byte (\$arg)

dfdl:unsignedByte (\$arg)

dfdl:short (\$arg)

dfdl:unsignedShort(\$arg)

dfdl:int (\$arg)

dfdl:unsignedInt (\$arg)

dfdl:long (\$arg)

dfdl:unsignedLong (\$arg)

If the string begins with \'x\', it is a Schema Definition Error if a
character appears other 0-9, a-f, A-F.

Each constructor function has a limit on the number of hex digits, with
no more digits than 2, 4, 8, or 16 for the byte, short, int and long
versions respectively. It is a Schema Definition Error if more digits
are encountered than are suitable for the type being created.

dfdl:hexBinary (\$arg)

If a literal number is not able to be represented by a long, it is a
Schema Definition Error.

Table 67: DFDL Constructor Functions

Expression deadlocks are always Schema Definition Errors

**19   DFDL Regular Expressions**

The following regular expression constructs are not common to both ICU
and Java(R) 7 and it is a Schema Definition Error if any are used in a
DFDL regular expression:

\\N{UNICODE CHARACTER NAME}

\\X

\\Uhhhhhhhh

(?# \... )

(?w-w)

(?d-d)

(?u-u)

(?U-U)

**23   Optional DFDL Features**

It is a Schema Definition Error if a DFDL schema uses an optional
feature that is not supported by a minimal or extended conforming
processor.
