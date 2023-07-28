#!/usr/bin/env python3

# Licensed to the Apache Software Foundation (ASF) under one or more
# contributor license agreements.  See the NOTICE file distributed with
# this work for additional information regarding copyright ownership.
# The ASF licenses this file to You under the Apache License, Version 2.0
# (the "License"); you may not use this file except in compliance with
# the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.


def generate_file(filename, num_lines, address_kind="dec"):
    converter = str
    if address_kind == "hex":
        converter = hex
    elif address_kind == "oct":
        converter = oct
    with open(filename, "w") as file:
        for i in range(0, num_lines * 16, 16):
            line = f"{converter(i).lstrip('0xo').zfill(6)}: 89ABCDE\n"
            file.write(line)


# Example usage: Generate a file with 100,000 lines, each line containing 16 bytes using hex addresses
generate_file("test-100000.txt", 100000, "hex")
