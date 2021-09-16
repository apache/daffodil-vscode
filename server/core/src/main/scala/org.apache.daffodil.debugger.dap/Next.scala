/*
 * Copyright 2021 Adam Rosien, John Wass
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.apache.daffodil.debugger.dap

import cats.effect._

/** Produce the next value in a series, like for data identifiers. */
trait Next[A] {
  def next(): IO[A]

  def map[B](f: A => B): Next[B] =
    () => next().map(f)
}

object Next {
  // TODO: optional starting value
  def int: IO[Next[Int]] =
    for {
      ids <- Ref[IO].of(0)
    } yield new Next[Int] {
      def next: IO[Int] = ids.getAndUpdate(_ + 1)
    }
}
