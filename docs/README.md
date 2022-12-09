<!--
  Licensed to the Apache Software Foundation (ASF) under one or more
  contributor license agreements.  See the NOTICE file distributed with
  this work for additional information regarding copyright ownership.
  The ASF licenses this file to You under the Apache License, Version 2.0
  (the "License"); you may not use this file except in compliance with
  the License.  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
-->
<div align="center">

<img src="https://daffodil.apache.org/assets/themes/apache/img/apache-daffodil-logo.png" height="85" alt="Apache Daffodil"/>

# Apache Daffodil™ Extension for Visual Studio Code: Documentation Generation

</div>

The documentation for the Apache Daffodil™ Extension for Visual Studio Code is maintained on its GitHub repository [wiki](https://github.com/apache/daffodil-vscode/wiki) (https://github.com/apache/daffodil-vscode/wiki), but there are times where portable, standalone documentation is needed.

## Requirements

1. [pandoc](https://pandoc.org)<sup><a href="#footnotes">1</a></sup> (https://pandoc.org) document converter

## Building The Documentation

To update and build the `.docx` documentation run:

```shell
make all
```

To clean up:

```shell
make clean
```

#### Footnotes
<sup>1</sup>Pandoc is free open source software, released under the [GPL](https://www.gnu.org/licenses/gpl-3.0.html) (https://www.gnu.org/licenses/gpl-3.0.html).